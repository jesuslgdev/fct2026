import { Injectable, inject } from '@angular/core';
import { DownloadProviderTemplateUseCase } from '@domain/usecases/supplier/download-provider-template.usecase';
import { ImportProvidersUseCase } from '@domain/usecases/supplier/import-providers.usecase';

export interface ExcelImportResult {
  success: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ImportError[];
  importedProviders?: ImportedProvider[];
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportedProvider {
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface ExcelTemplate {
  filename: string;
  data: ArrayBuffer;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {
  private readonly downloadProviderTemplateUseCase = inject(DownloadProviderTemplateUseCase);
  private readonly importProvidersUseCase = inject(ImportProvidersUseCase);

  // ── Download Excel template ─────────────────────────────────────────────
  async downloadTemplate(): Promise<ExcelTemplate> {
    try {
      return await this.downloadProviderTemplateUseCase.execute();
    } catch {
      // Fallback to a locally generated template if the endpoint fails
      const templateData = this.generateTemplateData();
      const filename = 'plantilla_proveedores.xlsx';
      
      return {
        filename,
        data: templateData,
      };
    }
  }

  // ── Generate template data (simulated) ───────────────────────────────────
  private generateTemplateData(): ArrayBuffer {
    // In a real case, this could come from the backend or use a library like xlsx
    const templateContent = this.createCsvTemplate(); // Simplified as CSV
    const encoder = new TextEncoder();
    return encoder.encode(templateContent).buffer;
  }

  private createCsvTemplate(): string {
    const headers = [
      'Nombre',
      'CIF', 
      'Dirección',
      'Ciudad',
      'Provincia',
      'Código postal',
      'Teléfono',
      'Email'
    ];
    
    const exampleRow = [
      'Empresa Ejemplo SL',
      'B12345678',
      'Calle Principal 123',
      'Madrid',
      'Madrid',
      '28001',
      '912345678',
      'contacto@empresa.com'
    ];

    return [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');
  }

  // ── Parse Excel/CSV file ───────────────────────────────────────────────
  async parseFile(file: File): Promise<ImportedProvider[]> {
    const content = await this.readFileContent(file);
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('El archivo debe contener al menos una fila de datos además de los encabezados');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const providers: ImportedProvider[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const provider = this.mapRowToProvider(headers, values, i + 1);
      
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private mapRowToProvider(headers: string[], values: string[], rowNumber: number): ImportedProvider | null {
    const fieldMapping: Record<string, keyof ImportedProvider> = {
      'Nombre': 'name',
      'CIF': 'taxId',
      'Dirección': 'address',
      'Ciudad': 'city',
      'Provincia': 'province',
      'Código postal': 'postalCode',
      'Teléfono': 'phone',
      'Email': 'email'
    };

    const provider: Partial<ImportedProvider> = {};

    headers.forEach((header, index) => {
      const field = fieldMapping[header];
      if (field && values[index]) {
        provider[field] = values[index] || undefined;
      }
    });

    // Validate required fields
    if (!provider.name || !provider.taxId || !provider.email) {
      console.warn(`Row ${rowNumber}: Missing required fields`);
      return null;
    }

    return provider as ImportedProvider;
  }

  // ── Validate supplier data ───────────────────────────────────────────────
  validateProviders(providers: ImportedProvider[]): ExcelImportResult {
    const errors: ImportError[] = [];
    const validProviders: ImportedProvider[] = [];

    providers.forEach((provider, index) => {
      const rowNumber = index + 2; // +2 because row 1 is the header
      const providerErrors = this.validateProvider(provider, rowNumber);
      
      if (providerErrors.length === 0) {
        validProviders.push(provider);
      } else {
        errors.push(...providerErrors);
      }
    });

    return {
      success: errors.length === 0,
      totalRecords: providers.length,
      validRecords: validProviders.length,
      invalidRecords: errors.length,
      errors,
      importedProviders: errors.length === 0 ? validProviders : []
    };
  }

  private validateProvider(provider: ImportedProvider, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate name
    if (!provider.name || provider.name.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Nombre',
        value: provider.name || '',
        message: 'El nombre es obligatorio'
      });
    } else if (provider.name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'Nombre',
        value: provider.name,
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }

    // Validate tax ID
    if (!provider.taxId || provider.taxId.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'CIF',
        value: provider.taxId || '',
        message: 'El CIF es obligatorio'
      });
    } else if (!/^[A-Z0-9]{8,9}$/.test(provider.taxId)) {
      errors.push({
        row: rowNumber,
        field: 'CIF',
        value: provider.taxId,
        message: 'El formato del CIF no es válido (8-9 caracteres alfanuméricos)'
      });
    }

    // Validate email
    if (!provider.email || provider.email.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        value: provider.email || '',
        message: 'El email es obligatorio'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.email)) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        value: provider.email,
        message: 'El formato del email no es válido'
      });
    }

    // Validate phone (optional)
    if (provider.phone && !/^[0-9]{9}$/.test(provider.phone.replace(/\s/g, ''))) {
      errors.push({
        row: rowNumber,
        field: 'Teléfono',
        value: provider.phone,
        message: 'El formato del teléfono no es válido (9 dígitos)'
      });
    }

    // Validate postal code (optional)
    if (provider.postalCode && !/^[0-9]{5}$/.test(provider.postalCode)) {
      errors.push({
        row: rowNumber,
        field: 'Código postal',
        value: provider.postalCode,
        message: 'El código postal debe tener 5 dígitos'
      });
    }

    return errors;
  }

  // ── Import suppliers to backend ───────────────────────────────────────
  async importProviders(file: File): Promise<{
    success: boolean;
    importedCount: number;
    message: string;
    errors?: ImportError[];
  }> {
    try {
      const backendResult = await this.importProvidersUseCase.execute(file);

      const errors: ImportError[] = (backendResult.errors ?? []).map((error) => ({
        row: error.row,
        field: 'general', // Backend does not specify the field
        value: '',
        message: error.reason,
      }));

      return {
        success: backendResult.success,
        importedCount: backendResult.importedCount,
        message: backendResult.message,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: unknown) {
      return {
        success: false,
        importedCount: 0,
        message: error instanceof Error ? error.message : 'Error desconocido durante la importación',
      };
    }
  }

  // ── Download file in browser ─────────────────────────────────────────
  downloadFile(data: ArrayBuffer, filename: string): void {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
