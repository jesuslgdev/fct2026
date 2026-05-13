import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeAll, vi, type Mock } from 'vitest';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Product } from '@domain/models/product.model';
import { SaleDetail } from '@domain/models/sale.model';
import { SaleDetailLineView, SaleDetailStore } from '@features/sales/state/sale-detail.store';
import { SaleDetailPageComponent } from './sale-detail.page.component';

beforeAll(() => {
  class ResizeObserverStub {
    observe(): void {
      return undefined;
    }

    unobserve(): void {
      return undefined;
    }

    disconnect(): void {
      return undefined;
    }
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
  });
});

interface MockSaleDetailStore {
  sale: WritableSignal<SaleDetail | null>;
  products: WritableSignal<Product[]>;
  loading: WritableSignal<boolean>;
  loadingCatalogs: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  successMessage: WritableSignal<string | null>;
  lineViews: WritableSignal<SaleDetailLineView[]>;
  subtotal: WritableSignal<number>;
  taxes: WritableSignal<number>;
  total: WritableSignal<number>;
  load: Mock<(saleId: number) => Promise<void>>;
  getStatusLabel: Mock<(status: SaleStatus) => string>;
}

const SALE_DETAIL: SaleDetail = {
  saleId: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 1,
  clientName: 'Cliente A',
  creatorName: 'Sales Employee',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED],
  deliveryAddress: 'Calle Mayor 1',
  saleDate: new Date('2026-04-01T10:00:00.000Z'),
  createdAt: new Date('2026-04-01T10:01:00.000Z'),
  updatedAt: new Date('2026-04-01T10:02:00.000Z'),
  userId: 7,
  subtotal: 100,
  taxes: 21,
  total: 121,
  lines: [],
  statusHistory: [
    {
      fromStatus: null,
      toStatus: SaleStatus.PENDING,
      changedAt: new Date('2026-04-01T10:01:00.000Z'),
      changedByUserId: 7,
      changedByName: 'Sales Employee',
    },
    {
      fromStatus: SaleStatus.PENDING,
      toStatus: SaleStatus.APPROVED,
      changedAt: new Date('2026-04-01T10:05:00.000Z'),
      changedByUserId: 9,
      changedByName: 'Manager User',
    },
  ],
};

const LINE_VIEW: SaleDetailLineView = {
  lineId: 100,
  saleLineId: 100,
  productId: 10,
  quantity: 1,
  discount: 0,
  discountType: 'percent',
  unitPrice: 100,
  vatRate: 0.21,
  productCode: 'PRD-10',
  productName: 'Producto A',
  lineSubtotal: 100,
  lineTax: 21,
  lineTotal: 121,
  validationError: null,
};

describe('SaleDetailPageComponent', () => {
  let fixture: ComponentFixture<SaleDetailPageComponent>;
  let store: MockSaleDetailStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn().mockResolvedValue(true) };
    store = {
      sale: signal<SaleDetail | null>(SALE_DETAIL),
      products: signal([]),
      loading: signal(false),
      loadingCatalogs: signal(false),
      error: signal(null),
      successMessage: signal(null),
      lineViews: signal([LINE_VIEW]),
      subtotal: signal(100),
      taxes: signal(21),
      total: signal(121),
      load: vi.fn().mockResolvedValue(undefined),
      getStatusLabel: vi.fn((status: SaleStatus) => {
        if (status === SaleStatus.PENDING) {
          return 'Pendiente';
        }

        if (status === SaleStatus.APPROVED) {
          return 'Aprobado';
        }

        return status;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [SaleDetailPageComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('1'),
              },
            },
          },
        },
      ],
    })
      .overrideComponent(SaleDetailPageComponent, {
        set: {
          providers: [{ provide: SaleDetailStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SaleDetailPageComponent);
    fixture.detectChanges();
  });

  it('loads the sale id from the route on init', () => {
    expect(store.load).toHaveBeenCalledWith(1);
  });

  it('renders the required sale detail fields', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Detalle de venta');
    expect(text).toContain('VEN-2026-0001');
    expect(text).toContain('Cliente A');
    expect(text).toContain('Pendiente');
    expect(text).toContain('Calle Mayor 1');
    expect(text).toContain('Sales Employee');
    expect(text).toContain('Producto A');
  });

  it('renders the status history with the purchase-style layout content', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Historial de estados');
    expect(text).toContain('Creación');
    expect(text).toContain('Pendiente');
    expect(text).toContain('Aprobado');
    expect(text).toContain('Por Sales Employee');
    expect(text).toContain('Por Manager User');
  });

  it('does not show edit action in the detail view', () => {
    const buttons = fixture.debugElement.queryAll(By.css('ui-button'));

    expect(buttons.some((button) => button.nativeElement.textContent.includes('Editar'))).toBe(false);
  });

  it('renders the status badge', () => {
    const badge = fixture.debugElement.query(By.css('ui-badge'));

    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('Pendiente');
  });

  it('maps distinct badge variants for the sale lifecycle', () => {
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.PENDING)).toBe('warning');
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.APPROVED)).toBe('info');
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.IN_PROCESS)).toBe('secondary');
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.SHIPPED)).toBe('contrast');
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.DELIVERED)).toBe('success');
    expect(fixture.componentInstance.getStatusBadgeVariant(SaleStatus.CANCELLED)).toBe('danger');
  });

  it('navigates back in browser history', () => {
    const historySpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    fixture.componentInstance.onBack();

    expect(historySpy).toHaveBeenCalled();
  });

  it('does not render the status history section when there are no entries', () => {
    store.sale.set({
      ...SALE_DETAIL,
      statusHistory: [],
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Historial de estados');
  });
});
