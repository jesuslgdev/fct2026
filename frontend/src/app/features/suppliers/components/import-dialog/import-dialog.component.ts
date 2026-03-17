import { ChangeDetectionStrategy, Component, inject, signal, output, EventEmitter, Output } from '@angular/core';
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

  // Signals para el estado del diálogo
  readonly visible = signal(false);
  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly importResult = signal<ExcelImportResult | null>(null);
  readonly currentStep = signal<'upload' | 'validation' | 'success'>('upload');

  // Output para notificar a la página principal cuando la importación se complete
  @Output() importCompleted = new EventEmitter<void>();

  // ── Acciones del diálogo ───────────────────────────────────────────────────
  open(): void {
    this.visible.set(true);
    this.currentStep.set('upload');
    this.selectedFile.set(null);
    this.importResult.set(null);
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
  }

  // ── Manejo de archivos ─────────────────────────────────────────────────────
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // .csv (alternativo)
      ];

      if (!validTypes.includes(file.type)) {
        alert('Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
        input.value = '';
        return;
      }

      this.selectedFile.set(file);
      this.importResult.set(null);
    }
  }

  // ── Drag and Drop ───────────────────────────────────────────────────────
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
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // .csv (alternativo)
      ];

      if (!validTypes.includes(file.type)) {
        alert('Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
        return;
      }

      this.selectedFile.set(file);
      this.importResult.set(null);
    }
  }

  // ── Descargar plantilla ───────────────────────────────────────────────────
  async downloadTemplate(): Promise<void> {
    try {
      this.loading.set(true);
      const template = await this.excelImportService.downloadTemplate();
      this.excelImportService.downloadFile(template.data, template.filename);
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      alert('Error al descargar la plantilla. Por favor, inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Validar archivo ───────────────────────────────────────────────────────
  async validateFile(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      alert('Por favor, selecciona un archivo');
      return;
    }

    try {
      this.loading.set(true);
      
      // Parsear archivo
      const providers = await this.excelImportService.parseFile(file);
      
      // Validar datos
      const result = this.excelImportService.validateProviders(providers);
      
      this.importResult.set(result);
      this.currentStep.set('validation');
      
    } catch (error) {
      console.error('Error al validar archivo:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el archivo');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Importar proveedores ───────────────────────────────────────────────────
  async importProviders(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      alert('Por favor, selecciona un archivo para importar');
      return;
    }

    try {
      this.loading.set(true);
      
      const importResult = await this.excelImportService.importProviders(file);
      
      if (importResult.success) {
        this.currentStep.set('success');
        // Actualizar el resultado para mostrar en el step de éxito
        this.importResult.set({
          success: true,
          totalRecords: importResult.importedCount,
          validRecords: importResult.importedCount,
          invalidRecords: 0,
          errors: [],
          importedProviders: [] // No necesitamos los detalles para el éxito
        });
        
        // Emitir evento para que la página principal recargue los datos
        this.importCompleted.emit();
      } else {
        // Mostrar errores del backend
        this.importResult.set({
          success: false,
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: importResult.errors?.length || 0,
          errors: importResult.errors || [],
          importedProviders: []
        });
        this.currentStep.set('validation');
      }
      
    } catch (error) {
      console.error('Error al importar proveedores:', error);
      alert('Error durante la importación. Por favor, inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Acciones de navegación ───────────────────────────────────────────────
  goBack(): void {
    if (this.currentStep() === 'validation') {
      this.currentStep.set('upload');
      this.importResult.set(null);
    }
  }

  // ── Utilidades ─────────────────────────────────────────────────────────────
  getErrorMessage(error: ImportError): string {
    return `Fila ${error.row} - ${error.field}: ${error.message}`;
  }

  getValidationSummary(): string {
    const result = this.importResult();
    if (!result) return '';
    
    return `${result.validRecords} válidos, ${result.invalidRecords} con errores de ${result.totalRecords} totales`;
  }

  getSuccessMessage(): string {
    const result = this.importResult();
    if (!result || !result.importedProviders) return '';
    
    return `Se han importado ${result.importedProviders.length} proveedores correctamente`;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }

  // ─── Helpers para UI ───────────────────────────────────────────────────────
  canValidate(): boolean {
    return this.selectedFile() !== null && !this.loading();
  }

  canImport(): boolean {
    // Ahora podemos importar directamente si tenemos un archivo válido
    return this.selectedFile() !== null && !this.loading();
  }

  getStepTitle(): string {
    switch (this.currentStep()) {
      case 'upload': return 'Importar Proveedores';
      case 'validation': return 'Validación de Datos';
      case 'success': return 'Importación Completada';
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
}
