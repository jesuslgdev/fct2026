import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { SupplierProductsImportDialogComponent } from './supplier-products-import-dialog.component';
import { SupplierProductsStore } from '@features/supplier-product/state/supplier-products.store';

describe('SupplierProductsImportDialogComponent', () => {
  let fixture: ComponentFixture<SupplierProductsImportDialogComponent>;
  let component: SupplierProductsImportDialogComponent;
  let mockStore: {
    supplierId: ReturnType<typeof signal<number | null>>;
    templateProductsPageSize: ReturnType<typeof signal<number>>;
    setImportFile: ReturnType<typeof vi.fn>;
    onTemplateProductsPageChange: ReturnType<typeof vi.fn>;
    downloadTemplate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockStore = {
      supplierId: signal(12),
      templateProductsPageSize: signal(10),
      setImportFile: vi.fn(),
      onTemplateProductsPageChange: vi.fn(),
      downloadTemplate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SupplierProductsImportDialogComponent],
    })
      .overrideComponent(SupplierProductsImportDialogComponent, {
        set: {
          template: '',
          imports: [],
          providers: [{ provide: SupplierProductsStore, useValue: mockStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierProductsImportDialogComponent);
    component = fixture.componentInstance;
  });

  it('stores the selected import file from the input event', () => {
    const file = new File(['data'], 'supplier-products.xlsx');

    component.onImportFileInput({ target: { files: [file] } } as never);

    expect(mockStore.setImportFile).toHaveBeenCalledWith(file);
  });

  it('forwards template product page changes with fallback rows', () => {
    component.onTemplateProductsPageChange({ first: 30 } as never);

    expect(mockStore.onTemplateProductsPageChange).toHaveBeenCalledWith({ first: 30, rows: 10 });
  });

  it('does nothing when template download returns null', async () => {
    mockStore.downloadTemplate.mockResolvedValue(null);
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL');

    await component.downloadTemplate();

    expect(createUrlSpy).not.toHaveBeenCalled();
  });

  it('downloads the template blob with a supplier-specific filename', async () => {
    const blob = new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.fn();
    const anchor = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    mockStore.downloadTemplate.mockResolvedValue(blob);

    await component.downloadTemplate();

    expect(createObjectUrlSpy).toHaveBeenCalledWith(blob);
    expect(anchor.href).toBe('blob:test');
    expect(anchor.download).toBe('supplier-12-products-template.xlsx');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test');

    createElementSpy.mockRestore();
  });

  it('builds stable checkbox ids for template products', () => {
    expect(component.getTemplateProductInputId(44)).toBe('supplier-template-product-44');
  });
});
