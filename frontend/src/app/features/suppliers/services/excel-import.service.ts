import { Injectable, inject } from '@angular/core';
import { DownloadSupplierTemplateUseCase } from '@domain/usecases/supplier/download-supplier-template.usecase';
import { ImportSuppliersUseCase } from '@domain/usecases/supplier/import-suppliers.usecase';
import * as XLSX from 'xlsx';

export interface ExcelImportResult {
  success: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ImportError[];
  importedSuppliers?: ImportedSupplier[];
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportedSupplier {
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
  private readonly downloadSupplierTemplateUseCase = inject(DownloadSupplierTemplateUseCase);
  private readonly importSuppliersUseCase = inject(ImportSuppliersUseCase);
  private static readonly TAX_ID_PATTERN =
    /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$/i;
  private static readonly PHONE_PATTERN = /^\d{9}$/;

  // Download Excel template
  async downloadTemplate(): Promise<ExcelTemplate> {
    try {
      return await this.downloadSupplierTemplateUseCase.execute();
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

  // Generate template data (simulated)
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

  // Parse Excel/CSV file
  async parseFile(file: File): Promise<ImportedSupplier[]> {
    if (this.isSpreadsheetFile(file)) {
      return this.parseSpreadsheetFile(file);
    }

    return this.parseDelimitedTextFile(file);
  }

  private async parseDelimitedTextFile(file: File): Promise<ImportedSupplier[]> {
    const content = await this.readFileContent(file);
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('El archivo debe contener al menos una fila de datos además de los encabezados');
    }

    const delimiter = this.detectDelimiter(lines[0]);
    const headers = this.parseDelimitedLine(lines[0], delimiter).map((header) =>
      header.trim().replace(/^\uFEFF/, ''),
    );
    const suppliers: ImportedSupplier[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseDelimitedLine(lines[i], delimiter);
      const supplier = this.mapRowToSupplier(headers, values);
      suppliers.push(supplier);
    }

    return suppliers;
  }

  private async parseSpreadsheetFile(file: File): Promise<ImportedSupplier[]> {
    let workbook: XLSX.WorkBook;

    try {
      const fileBuffer = await this.readFileBuffer(file);
      workbook = XLSX.read(fileBuffer, { type: 'array' });
    } catch {
      throw new Error('No se pudo leer el archivo Excel. Comprueba que no esté dañado.');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('El archivo Excel no contiene hojas con datos.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });

    if (rows.length < 2) {
      throw new Error('El archivo debe contener al menos una fila de datos además de los encabezados');
    }

    const headers = rows[0].map((headerCell) =>
      String(headerCell ?? '').trim().replace(/^\uFEFF/, ''),
    );
    const suppliers: ImportedSupplier[] = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] ?? [];
      const values = headers.map((_, columnIndex) => String(row[columnIndex] ?? '').trim());
      const supplier = this.mapRowToSupplier(headers, values);
      suppliers.push(supplier);
    }

    return suppliers;
  }

  private parseDelimitedLine(line: string, delimiter = ','): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        const nextChar = line[index + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  }

  private detectDelimiter(line: string): string {
    const candidates = [',', ';', '\t', '|'];
    const counts = new Map<string, number>(candidates.map((candidate) => [candidate, 0]));
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        const nextChar = line[index + 1];
        if (inQuotes && nextChar === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (inQuotes) {
        continue;
      }

      if (counts.has(char)) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
    }

    let bestDelimiter = ',';
    let bestCount = -1;

    for (const candidate of candidates) {
      const currentCount = counts.get(candidate) ?? 0;
      if (currentCount > bestCount) {
        bestDelimiter = candidate;
        bestCount = currentCount;
      }
    }

    return bestDelimiter;
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private async readFileBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  private isSpreadsheetFile(file: File): boolean {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      return true;
    }

    if (lowerName.endsWith('.csv')) {
      return false;
    }

    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || file.type === 'application/vnd.ms-excel';
  }

  private mapRowToSupplier(headers: string[], values: string[]): ImportedSupplier {
    const fieldMapping: Record<string, keyof ImportedSupplier> = {
      nombre: 'name',
      'razon social': 'name',
      cif: 'taxId',
      nif: 'taxId',
      'nif/cif': 'taxId',
      direccion: 'address',
      ciudad: 'city',
      provincia: 'province',
      'codigo postal': 'postalCode',
      cp: 'postalCode',
      telefono: 'phone',
      email: 'email',
    };

    const supplier: ImportedSupplier = {
      name: '',
      taxId: '',
      email: '',
      phone: undefined,
      address: undefined,
      city: undefined,
      province: undefined,
      postalCode: undefined,
    };

    headers.forEach((header, index) => {
      const normalizedHeader = this.normalizeHeader(header);
      const field = fieldMapping[normalizedHeader];
      if (field && values[index]) {
        const parsedValue = values[index]?.trim() ?? '';

        if (field === 'name' || field === 'taxId' || field === 'email') {
          supplier[field] = parsedValue;
          return;
        }

        supplier[field] = parsedValue || undefined;
      }
    });

    return supplier;
  }

  private normalizeHeader(header: string): string {
    return header
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  // Validate supplier data
  validateSuppliers(suppliers: ImportedSupplier[]): ExcelImportResult {
    const errors: ImportError[] = [];
    const validSuppliers: ImportedSupplier[] = [];
    const seenTaxIds = new Map<string, number>();
    let invalidRows = 0;

    suppliers.forEach((supplier, index) => {
      const rowNumber = index + 2; // +2 because row 1 is the header
      const supplierErrors = this.validateSupplier(supplier, rowNumber);

      const normalizedTaxId = supplier.taxId?.trim().toUpperCase() ?? '';
      const hasTaxIdErrors = supplierErrors.some((error) => error.field === 'CIF');
      if (!hasTaxIdErrors && normalizedTaxId.length > 0) {
        const firstRowWithTaxId = seenTaxIds.get(normalizedTaxId);
        if (firstRowWithTaxId !== undefined) {
          supplierErrors.push({
            row: rowNumber,
            field: 'CIF',
            value: normalizedTaxId,
            message: `El CIF está duplicado en el archivo (primera aparición en la fila ${firstRowWithTaxId})`,
          });
        } else {
          seenTaxIds.set(normalizedTaxId, rowNumber);
        }
      }

      if (supplierErrors.length === 0) {
        validSuppliers.push(supplier);
      } else {
        invalidRows += 1;
        errors.push(...supplierErrors);
      }
    });

    return {
      success: errors.length === 0,
      totalRecords: suppliers.length,
      validRecords: validSuppliers.length,
      invalidRecords: invalidRows,
      errors,
      importedSuppliers: errors.length === 0 ? validSuppliers : []
    };
  }

  private validateSupplier(supplier: ImportedSupplier, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate name
    const normalizedName = supplier.name?.trim() ?? '';
    if (normalizedName.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Nombre',
        value: supplier.name || '',
        message: 'El nombre es obligatorio'
      });
    } else if (normalizedName.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'Nombre',
        value: normalizedName,
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }

    // Validate tax ID
    const normalizedTaxId = supplier.taxId?.trim().toUpperCase() ?? '';
    if (normalizedTaxId.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'CIF',
        value: supplier.taxId || '',
        message: 'El CIF es obligatorio'
      });
    } else if (!ExcelImportService.TAX_ID_PATTERN.test(normalizedTaxId)) {
      errors.push({
        row: rowNumber,
        field: 'CIF',
        value: normalizedTaxId,
        message: 'El formato del CIF no es válido'
      });
    }

    // Validate email
    const normalizedEmail = supplier.email?.trim() ?? '';
    if (normalizedEmail.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        value: supplier.email || '',
        message: 'El email es obligatorio'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        value: normalizedEmail,
        message: 'El formato del email no es válido'
      });
    }

    // Validate phone (required in backend import contract)
    const normalizedPhone = supplier.phone?.trim() ?? '';
    if (normalizedPhone.length === 0) {
      errors.push({
        row: rowNumber,
        field: 'Teléfono',
        value: supplier.phone || '',
        message: 'El teléfono es obligatorio'
      });
    } else if (!ExcelImportService.PHONE_PATTERN.test(normalizedPhone)) {
      errors.push({
        row: rowNumber,
        field: 'Teléfono',
        value: normalizedPhone,
        message: 'El formato del teléfono no es válido (exactamente 9 dígitos)'
      });
    }

    // Validate postal code (optional)
    if (supplier.postalCode && !/^[0-9]{5}$/.test(supplier.postalCode)) {
      errors.push({
        row: rowNumber,
        field: 'Código postal',
        value: supplier.postalCode,
        message: 'El código postal debe tener 5 dígitos'
      });
    }

    return errors;
  }

  // Import suppliers to backend
  async importSuppliers(file: File): Promise<{
    success: boolean;
    importedCount: number;
    message: string;
    errors?: ImportError[];
  }> {
    try {
      const backendResult = await this.importSuppliersUseCase.execute(file);

      const errors: ImportError[] = (backendResult.errors ?? []).map((error) => ({
        row: error.row,
        field: 'general', // Backend does not specify the field
        value: '',
        message: this.translateImportReason(error.reason),
      }));

      return {
        success: backendResult.success,
        importedCount: backendResult.importedCount,
        message: this.translateImportReason(backendResult.message),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: unknown) {
      return {
        success: false,
        importedCount: 0,
        message:
          error instanceof Error
            ? this.translateImportReason(error.message)
            : 'Se ha producido un error inesperado durante la importación.',
      };
    }
  }

  private translateImportReason(reason: string): string {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      return 'Se ha producido un error durante la importación.';
    }

    const literalMap: Record<string, string> = {
      'Import completed successfully': 'Importación completada correctamente.',
      'Invalid file format': 'El formato del archivo no es válido.',
      'No file provided': 'No se ha adjuntado ningún archivo.',
      'Invalid or corrupted file': 'El archivo está corrupto o no es válido.',
      'File is empty or has no data rows': 'El archivo está vacío o no contiene filas de datos.',
      'Invalid headers. Use the provided template': 'Los encabezados del archivo no son válidos. Usa la plantilla oficial.',
      'Supplier with this tax ID already exists': 'Ya existe un proveedor con ese NIF/CIF.',
      'Supplier with this email already exists': 'Ya existe un proveedor con ese correo electrónico.',
      'Invalid tax ID format': 'El NIF/CIF no tiene un formato válido.',
      'Invalid CIF format': 'El formato del CIF no es válido.',
      'Invalid postal code format': 'El formato del código postal no es válido.',
      'Invalid phone format': 'El formato del teléfono no es válido.',
      'Invalid email format': 'El formato del correo electrónico no es válido.',
      'Duplicate CIF in file': 'Hay un CIF duplicado en el archivo.',
      'Validation failed': 'Hay datos inválidos en el archivo.',
      'Phone number must contain exactly 9 digits': 'El teléfono debe tener exactamente 9 dígitos.',
      'Email is not valid': 'El correo electrónico no es válido.',
      'Name is required': 'El nombre es obligatorio.',
      'Tax ID is required': 'El NIF/CIF es obligatorio.',
      'Email is required': 'El correo electrónico es obligatorio.',
    };

    if (literalMap[normalizedReason]) {
      return literalMap[normalizedReason];
    }

    const requiredFieldMatch = normalizedReason.match(/^Field\s+'(.+)'\s+is\s+required$/i);
    if (requiredFieldMatch) {
      const fieldLabel = this.translateImportField(requiredFieldMatch[1]);
      return `El campo ${fieldLabel} es obligatorio.`;
    }

    const maxLengthMatch = normalizedReason.match(
      /^Field\s+'(.+)'\s+exceeds\s+maximum\s+length\s+of\s+(\d+)$/i,
    );
    if (maxLengthMatch) {
      const fieldLabel = this.translateImportField(maxLengthMatch[1]);
      return `El campo ${fieldLabel} supera la longitud máxima de ${maxLengthMatch[2]} caracteres.`;
    }

    const existingCifMatch = normalizedReason.match(/^CIF\s+(.+)\s+already\s+exists\s+in\s+database$/i);
    if (existingCifMatch) {
      return `El CIF ${existingCifMatch[1]} ya existe en la base de datos.`;
    }

    if (normalizedReason.toLowerCase().includes('row')) {
      return normalizedReason
        .replace(/Row/gi, 'Fila')
        .replace(/column/gi, 'columna')
        .replace(/invalid/gi, 'no válido')
        .replace(/required/gi, 'obligatorio');
    }

    return normalizedReason;
  }

  private translateImportField(field: string): string {
    const fieldMap: Record<string, string> = {
      Nombre: 'Nombre',
      CIF: 'CIF',
      Dirección: 'Dirección',
      Ciudad: 'Ciudad',
      Provincia: 'Provincia',
      'Código Postal': 'Código postal',
      Teléfono: 'Teléfono',
      Email: 'Email',
      name: 'Nombre',
      tax_id: 'CIF',
      street: 'Dirección',
      city: 'Ciudad',
      province: 'Provincia',
      postal_code: 'Código postal',
      phone: 'Teléfono',
      email: 'Email',
    };

    return fieldMap[field] ?? field;
  }

  // Download file in browser
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

