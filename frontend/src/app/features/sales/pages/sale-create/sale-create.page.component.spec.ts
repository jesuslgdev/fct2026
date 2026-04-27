import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { vi, type Mock } from 'vitest';
import { Client } from '@domain/models/client.model';
import { Product } from '@domain/models/product.model';
import { SaleDiscountType } from '@domain/models/sale.model';
import { Warehouse } from '@domain/models/warehouse.model';
import {
  SaleCreateLineDraft,
  SaleCreateLineEditDraft,
  SaleCreateLineView,
  SaleCreateStore,
} from '@features/sales/state/sale-create.store';
import { SaleCreatePageComponent } from './sale-create.page.component';

interface MockSaleCreateStore {
  clients: WritableSignal<Client[]>;
  warehouses: WritableSignal<Warehouse[]>;
  products: WritableSignal<Product[]>;
  lines: WritableSignal<SaleCreateLineDraft[]>;
  selectedClientId: WritableSignal<number | null>;
  selectedWarehouseId: WritableSignal<number | null>;
  loading: WritableSignal<boolean>;
  loadingProducts: WritableSignal<boolean>;
  loadingClientDetail: WritableSignal<boolean>;
  submitting: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  successMessage: WritableSignal<string | null>;
  canEditLines: Mock<() => boolean>;
  canSubmit: Mock<() => boolean>;
  deliveryAddress: Mock<() => string>;
  availableProducts: Mock<() => Product[]>;
  getLineDraft: Mock<(lineId: number) => SaleCreateLineEditDraft | undefined>;
  getLineView: Mock<(lineId: number) => SaleCreateLineView | undefined>;
  subtotal: Mock<() => number>;
  taxes: Mock<() => number>;
  total: Mock<() => number>;
  initialize: Mock<() => Promise<void>>;
  addLine: Mock<() => void>;
  removeLine: Mock<(lineId: number) => void>;
  startLineEdit: Mock<(line: SaleCreateLineDraft) => void>;
  cancelLineEdit: Mock<(lineId: number) => void>;
  clearAllLineDrafts: Mock<() => void>;
  onClientChange: Mock<(clientId: number | null) => Promise<void>>;
  onWarehouseChange: Mock<(warehouseId: number | null) => Promise<void>>;
  onDraftProductChange: Mock<(lineId: number, productId: number | null) => void>;
  onDraftQuantityChange: Mock<(lineId: number, quantity: string | number | null) => void>;
  onDraftDiscountChange: Mock<(lineId: number, discount: string | number | null) => void>;
  onDraftDiscountTypeChange: Mock<(lineId: number, discountType: SaleDiscountType) => void>;
  getLineStockPreview: Mock<
    (lineId: number) => { availableStock: number | null; stockLoading: boolean; stockError: string | null } | undefined
  >;
  clearLineStockPreview: Mock<(lineId: number) => void>;
  clearAllLineStockPreviews: Mock<() => void>;
  saveLineEdit: Mock<(lineId: number) => Promise<void>>;
  submit: Mock<() => Promise<void>>;
}

const PRODUCT_A: Product = {
  productId: 100,
  code: 'P-100',
  name: 'Producto A',
  description: 'Descripcion',
  categoryId: 1,
  categoryName: 'Categoria',
  price: 10,
  vatRate: 0.21,
  stock: 30,
  minStock: 5,
  isActive: true,
};

const LINE_A: SaleCreateLineDraft = {
  lineId: 1,
  productId: 100,
  quantity: 1,
  discount: 0,
  discountType: 'percent',
  availableStock: 8,
  stockLoading: false,
  stockError: null,
  validationError: null,
};

function buildLineView(line: SaleCreateLineDraft): SaleCreateLineView {
  const grossAmount = 10 * line.quantity;
  const discountAmount =
    line.discountType === 'percent' ? grossAmount * (line.discount / 100) : line.discount;
  const lineSubtotal = grossAmount - discountAmount;
  const lineTax = lineSubtotal * 0.21;

  return {
    ...line,
    productName: 'Producto A',
    productCode: 'P-100',
    unitPrice: 10,
    vatRate: 0.21,
    grossAmount,
    discountAmount,
    lineSubtotal,
    lineTax,
    lineTotal: lineSubtotal + lineTax,
  };
}

describe('SaleCreatePageComponent', () => {
  let fixture: ComponentFixture<SaleCreatePageComponent>;
  let component: SaleCreatePageComponent;
  let store: MockSaleCreateStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    store = {
      clients: signal<Client[]>([]),
      warehouses: signal<Warehouse[]>([]),
      products: signal<Product[]>([PRODUCT_A]),
      lines: signal<SaleCreateLineDraft[]>([LINE_A]),
      selectedClientId: signal<number | null>(null),
      selectedWarehouseId: signal<number | null>(null),
      loading: signal(false),
      loadingProducts: signal(false),
      loadingClientDetail: signal(false),
      submitting: signal(false),
      error: signal<string | null>(null),
      successMessage: signal<string | null>(null),
      canEditLines: vi.fn(() => false),
      canSubmit: vi.fn(() => false),
      deliveryAddress: vi.fn(() => ''),
      availableProducts: vi.fn(() => [PRODUCT_A]),
      getLineDraft: vi.fn(() => undefined),
      getLineView: vi.fn((lineId: number) => {
        const line = store.lines().find((item) => item.lineId === lineId);
        return line ? buildLineView(line) : undefined;
      }),
      subtotal: vi.fn(() => buildLineView(store.lines()[0]).lineSubtotal),
      taxes: vi.fn(() => buildLineView(store.lines()[0]).lineTax),
      total: vi.fn(() => buildLineView(store.lines()[0]).lineTotal),
      initialize: vi.fn().mockResolvedValue(undefined),
      addLine: vi.fn(),
      removeLine: vi.fn(),
      startLineEdit: vi.fn(),
      cancelLineEdit: vi.fn(),
      clearAllLineDrafts: vi.fn(),
      onClientChange: vi.fn().mockResolvedValue(undefined),
      onWarehouseChange: vi.fn().mockResolvedValue(undefined),
      onDraftProductChange: vi.fn(),
      onDraftQuantityChange: vi.fn(),
      onDraftDiscountChange: vi.fn(),
      onDraftDiscountTypeChange: vi.fn(),
      getLineStockPreview: vi.fn(() => undefined),
      clearLineStockPreview: vi.fn(),
      clearAllLineStockPreviews: vi.fn(),
      saveLineEdit: vi.fn().mockResolvedValue(undefined),
      submit: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SaleCreatePageComponent],
      providers: [
        {
          provide: Router,
          useValue: router,
        },
      ],
    })
      .overrideComponent(SaleCreatePageComponent, {
        set: {
          providers: [{ provide: SaleCreateStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SaleCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra la columna de acciones en la cabecera de lineas', () => {
    const headers = fixture.debugElement.queryAll(By.css('th'));
    expect(headers.some((header) => header.nativeElement.textContent.trim() === 'Acciones')).toBe(true);
  });

  it('muestra una columna dedicada al codigo de producto', () => {
    const headers = fixture.debugElement.queryAll(By.css('th'));
    const headerTexts = headers.map((header) => header.nativeElement.textContent.trim());

    expect(headerTexts).toContain('Codigo');
    expect(headerTexts).toContain('Producto');
    expect(headerTexts.indexOf('Codigo')).toBeLessThan(headerTexts.indexOf('Producto'));
  });

  it('deshabilita el boton de anadir linea hasta seleccionar cliente y almacen', () => {
    const addLineButton = fixture.debugElement.queryAll(By.css('ui-button'))[2].componentInstance;
    expect(addLineButton.disabled()).toBe(true);

    store.canEditLines.mockReturnValue(true);
    fixture.detectChanges();

    expect(addLineButton.disabled()).toBe(false);
  });

  it('no permite entrar en edicion de fila mientras las lineas esten bloqueadas', () => {
    component.onStartLineEdit(LINE_A);

    expect(component.getLineDraft(LINE_A.lineId)).toBeUndefined();
    expect(store.startLineEdit).not.toHaveBeenCalled();
  });

  it('muestra un mensaje guia cuando aun no se puede operar con lineas', () => {
    const helperText = fixture.debugElement.queryAll(By.css('p'))
      .find((paragraph) => paragraph.nativeElement.textContent.includes('Selecciona primero el cliente y el almacen'));

    expect(helperText).toBeDefined();
  });

  it('solicita una previsualizacion de stock al cambiar el producto del draft', () => {
    store.canEditLines.mockReturnValue(true);
    component.onStartLineEdit(LINE_A);

    component.onDraftProductChange(LINE_A.lineId, PRODUCT_A.productId);

    expect(store.onDraftProductChange).toHaveBeenCalledWith(LINE_A.lineId, PRODUCT_A.productId);
  });
});
