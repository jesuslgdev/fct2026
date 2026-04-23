import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ExcelImportService, ImportedSupplier } from './excel-import.service';
import { DownloadSupplierTemplateUseCase } from '@domain/usecases/supplier/download-supplier-template.usecase';
import { ImportSuppliersUseCase } from '@domain/usecases/supplier/import-suppliers.usecase';

describe('ExcelImportService phone validation', () => {
  let service: ExcelImportService;

  beforeEach(() => {
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
            execute: vi.fn(),
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
});
