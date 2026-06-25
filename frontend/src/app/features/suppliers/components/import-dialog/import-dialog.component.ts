import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExcelImportService, ExcelImportResult, ImportError } from '@features/suppliers/services/excel-import.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { CardComponent } from '@shared/ui/card/card.component';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    DialogComponent,
    CardComponent,
  ],
  templateUrl: './import-dialog.component.html',
})
export class ImportDialogComponent {
  private readonly excelImportService = inject(ExcelImportService);

  // Dialog state signals
  readonly visible = signal(false);
  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly importResult = signal<ExcelImportResult | null>(null);
  readonly currentStep = signal<'upload' | 'validation' | 'success'>('upload');
  readonly inlineError = signal<string | null>(null);

  // Output to notify the main page when import completes
  @Output() importCompleted = new EventEmitter<void>();

  // Dialog actions
  open(): void {
    this.visible.set(true);
    this.currentStep.set('upload');
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.inlineError.set(null);
  }

  close(): void {
    this.visible.set(false);
    this.resetState();
  }

  private resetState(): void {
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.currentStep.set('upload');
    this.loading.set(false);
    this.inlineError.set(null);
  }

  // File handling
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const validationError = this.validateFileType(file);
    if (validationError) {
      this.inlineError.set(validationError);
      input.value = '';
      return;
    }

    this.inlineError.set(null);
    this.selectedFile.set(file);
    this.importResult.set(null);
  }

  // Drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const validationError = this.validateFileType(file);
    if (validationError) {
      this.inlineError.set(validationError);
      return;
    }

    this.inlineError.set(null);
    this.selectedFile.set(file);
    this.importResult.set(null);
  }

  // Download template
  async downloadTemplate(): Promise<void> {
    try {
      this.loading.set(true);
      this.inlineError.set(null);
      const template = await this.excelImportService.downloadTemplate();
      this.excelImportService.downloadFile(template.data, template.filename);
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      this.inlineError.set('No hemos podido descargar la plantilla. Intentalo de nuevo en unos segundos.');
    } finally {
      this.loading.set(false);
    }
  }

  // Validate file and move to validation step
  async validateFile(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.inlineError.set('Selecciona un archivo para continuar.');
      return;
    }

    try {
      this.loading.set(true);
      this.inlineError.set(null);
      this.importResult.set(null);

      // 1) Parse and validate locally
      const suppliers = await this.excelImportService.parseFile(file);
      if (suppliers.length === 0) {
        this.inlineError.set('El archivo no contiene proveedores para importar.');
        return;
      }

      const result = this.excelImportService.validateSuppliers(suppliers);
      this.importResult.set(result);
      this.currentStep.set('validation');

      if (!result.success) {
        this.inlineError.set('Hemos encontrado errores en el archivo. Revisa el detalle y corrigelos antes de importar.');
      }
    } catch (error) {
      console.error('Error al validar archivo:', error);
      this.inlineError.set(error instanceof Error ? error.message : 'No hemos podido comprobar el archivo. Intentalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async importSuppliers(): Promise<void> {
    const file = this.selectedFile();
    const currentValidation = this.importResult();

    if (!file) {
      this.inlineError.set('Selecciona un archivo para continuar.');
      return;
    }

    if (!currentValidation?.success) {
      this.inlineError.set('Corrige los errores del archivo antes de importar.');
      return;
    }

    try {
      this.loading.set(true);
      this.inlineError.set(null);

      const importResult = await this.excelImportService.importSuppliers(file);
      if (!importResult.success) {
        this.importResult.set({
          success: false,
          totalRecords: currentValidation.totalRecords,
          validRecords: 0,
          invalidRecords: importResult.errors?.length ?? 0,
          errors: importResult.errors ?? [],
          importedSuppliers: [],
        });
        this.inlineError.set(importResult.message);
        this.currentStep.set('validation');
        return;
      }

      this.currentStep.set('success');
      this.importResult.set({
        success: true,
        totalRecords: currentValidation.totalRecords,
        validRecords: importResult.importedCount,
        invalidRecords: 0,
        errors: [],
      });
      this.importCompleted.emit();
    } catch (error) {
      console.error('Error al importar proveedores:', error);
      this.inlineError.set(error instanceof Error ? error.message : 'No hemos podido completar la importacion. Intentalo de nuevo.');
      this.currentStep.set('validation');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.currentStep.set('upload');
    this.importResult.set(null);
    this.inlineError.set(null);
  }

  // Utilities
  getErrorMessage(error: ImportError): string {
    if (error.field.toLowerCase() === 'general') {
      return `Fila ${error.row}: ${error.message}`;
    }

    return `Fila ${error.row} - ${error.field}: ${error.message}`;
  }

  getValidationSummary(): string {
    const result = this.importResult();
    if (!result) return '';
    
    return `${result.validRecords} válidos, ${result.invalidRecords} con errores de ${result.totalRecords} totales`;
  }

  getSuccessMessage(): string {
    const result = this.importResult();
    if (!result) return '';

    const importedCount = result.validRecords;
    return `Se han importado ${importedCount} proveedores correctamente`;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }

  // UI helpers
  canValidate(): boolean {
    return this.selectedFile() !== null && !this.loading();
  }

  canImport(): boolean {
    return this.selectedFile() !== null && this.importResult()?.success === true && !this.loading();
  }

  getStepTitle(): string {
    switch (this.currentStep()) {
      case 'upload': return 'Importar Proveedores';
      case 'validation': return 'Validacion de datos';
      case 'success': return 'Importación completada';
      default: return 'Importar Proveedores';
    }
  }

  getFileName(): string {
    return this.selectedFile()?.name || '';
  }

  getFileSize(): string {
    const file = this.selectedFile();
    if (!file) return '';
    
    const size = file.size;
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private validateFileType(file: File): string | null {
    const validMimeTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ]);

    const lowerName = file.name.toLowerCase();
    const hasValidExtension = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv');
    const hasValidMime = file.type.length === 0 || validMimeTypes.has(file.type);

    if (!hasValidExtension || !hasValidMime) {
      return 'Formato no compatible. Usa un archivo .xlsx, .xls o .csv.';
    }

    return null;
  }
}

