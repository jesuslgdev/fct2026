import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ExcelImportService, ImportedSupplier } from './excel-import.service';
import { DownloadSupplierTemplateUseCase } from '@domain/usecases/supplier/download-supplier-template.usecase';
import { ImportSuppliersUseCase } from '@domain/usecases/supplier/import-suppliers.usecase';
import * as XLSX from 'xlsx';

describe('ExcelImportService phone validation', () => {
  let service: ExcelImportService;
  let importSuppliersExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    importSuppliersExecute = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ExcelImportService,
        {
          provide: DownloadSupplierTemplateUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: ImportSuppliersUseCase,
          useValue: {
            execute: importSuppliersExecute,
          },
        },
      ],
    });

    service = TestBed.inject(ExcelImportService);
  });

  function baseSupplier(overrides: Partial<ImportedSupplier> = {}): ImportedSupplier {
    return {
      name: 'Proveedor Test',
      taxId: 'B12345678',
      email: 'proveedor@test.com',
      phone: '912345678',
      ...overrides,
    };
  }

  it('accepts phone with exactly 9 digits', () => {
    const result = service.validateSuppliers([
      baseSupplier({ phone: '912345678' }),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(0);
  });

  it('rejects missing phone as required', () => {
    const result = service.validateSuppliers([
      baseSupplier({ phone: '' }),
    ]);

    expect(result.validRecords).toBe(0);
    expect(result.errors.some((error) => error.field === 'Teléfono' && error.message.includes('obligatorio'))).toBe(true);
  });

  it('rejects formatted phone that is not exactly 9 digits', () => {
    const result = service.validateSuppliers([
      baseSupplier({ phone: '+34 900-123-456' }),
    ]);

    expect(result.validRecords).toBe(0);
    expect(result.errors.some((error) => error.field === 'Teléfono' && error.message.includes('formato'))).toBe(true);
  });

  it('counts invalid records per row, not per error', () => {
    const result = service.validateSuppliers([
      baseSupplier({ name: '', email: '' }),
    ]);

    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.invalidRecords).toBe(1);
  });

  it('parses CSV files with semicolon separators and reports non-required format errors', async () => {
    const csvContent = [
      'Nombre;CIF;Dirección;Ciudad;Provincia;Código postal;Teléfono;Email',
      'Proveedor Demo;B12345678;Calle Mayor 1;Madrid;Madrid;28001;912345678;correo-invalido',
    ].join('\n');
    const file = new File([csvContent], 'proveedores.csv', { type: 'text/csv' });

    const suppliers = await service.parseFile(file);
    const result = service.validateSuppliers(suppliers);

    expect(result.invalidRecords).toBe(1);
    expect(result.errors.some((error) => error.field === 'Email' && error.message.includes('formato'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('obligatorio'))).toBe(false);
  });

  it('parses XLSX files and reports non-required format errors', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Nombre', 'CIF', 'Dirección', 'Ciudad', 'Provincia', 'Código postal', 'Teléfono', 'Email'],
      ['Proveedor Demo', 'B12345678', 'Calle Mayor 1', 'Madrid', 'Madrid', '28001', '912345678', 'correo-invalido'],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
    const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new File([xlsxData], 'proveedores.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const suppliers = await service.parseFile(file);
    const result = service.validateSuppliers(suppliers);

    expect(result.invalidRecords).toBe(1);
    expect(result.errors.some((error) => error.field === 'Email' && error.message.includes('formato'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('obligatorio'))).toBe(false);
  });

  it('translates backend import errors to friendly Spanish', async () => {
    importSuppliersExecute.mockResolvedValue({
      success: false,
      importedCount: 0,
      message: 'Validation failed',
      errors: [
        { row: 4, reason: 'Supplier with this email already exists' },
        { row: 5, reason: 'Invalid CIF format' },
        { row: 6, reason: "Field 'Email' is required" },
        { row: 7, reason: 'Duplicate CIF in file' },
      ],
    });

    const file = new File(['dummy'], 'proveedores.csv', { type: 'text/csv' });
    const result = await service.importSuppliers(file);

    expect(result.success).toBe(false);
    expect(result.message).toContain('datos inválidos');
    expect(result.errors?.[0].message).toContain('correo electrónico');
    expect(result.errors?.[1].message).toContain('formato del CIF');
    expect(result.errors?.[2].message).toContain('es obligatorio');
    expect(result.errors?.[3].message).toContain('duplicado');
  });
});
