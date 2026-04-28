import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Product } from '@domain/models/product.model';
import { SaleNotFoundError } from '@domain/models/sale-errors';
import { SaleDetail } from '@domain/models/sale.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { GetSaleUseCase } from '@domain/usecases/sales/get-sale.usecase';
import { SaleDetailStore } from './sale-detail.store';

const PRODUCT_A: Product = {
  productId: 10,
  code: 'PRD-10',
  name: 'Producto A',
  description: '',
  categoryId: 1,
  categoryName: 'General',
  price: 100,
  vatRate: 0.21,
  stock: 10,
  minStock: 1,
  isActive: true,
};

const SALE_DETAIL: SaleDetail = {
  saleId: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 1,
  clientName: 'Cliente A',
  creatorName: 'Sales Employee',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
  deliveryAddress: 'Calle Mayor 1',
  saleDate: new Date('2026-04-01T10:00:00.000Z'),
  createdAt: new Date('2026-04-01T10:01:00.000Z'),
  updatedAt: new Date('2026-04-01T10:02:00.000Z'),
  userId: 7,
  subtotal: 100,
  taxes: 21,
  total: 121,
  lines: [
    {
      saleLineId: 100,
      saleId: 1,
      productId: 10,
      quantity: 1,
      unitPrice: 100,
      discount: 0,
      lineSubtotal: 100,
      vatRate: 0.21,
      lineTax: 21,
    },
  ],
  statusHistory: [],
};

class MockGetSaleUseCase {
  execute = vi.fn().mockReturnValue(of(SALE_DETAIL));
}

class MockGetProductsUseCase {
  execute = vi.fn().mockReturnValue(
    of({ data: [PRODUCT_A], total: 1, page: 1, pageSize: 100 }),
  );
}

describe('SaleDetailStore', () => {
  let store: SaleDetailStore;
  let getSaleUseCase: MockGetSaleUseCase;

  beforeEach(() => {
    getSaleUseCase = new MockGetSaleUseCase();

    TestBed.configureTestingModule({
      providers: [
        SaleDetailStore,
        { provide: GetSaleUseCase, useValue: getSaleUseCase },
        { provide: GetProductsUseCase, useValue: new MockGetProductsUseCase() },
      ],
    });

    store = TestBed.inject(SaleDetailStore);
  });

  it('loads sale detail and product names for read-only lines', async () => {
    await store.load(1);

    expect(getSaleUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.sale()).toEqual(SALE_DETAIL);
    expect(store.lineViews()[0]).toMatchObject({
      productCode: 'PRD-10',
      productName: 'Producto A',
      lineSubtotal: 100,
      lineTax: 21,
      lineTotal: 121,
    });
    expect(store.total()).toBe(121);
  });

  it('maps status labels for the detail view', () => {
    expect(store.getStatusLabel(SaleStatus.PENDING)).toBe('Pendiente');
    expect(store.getStatusLabel(SaleStatus.APPROVED)).toBe('Aprobada');
  });

  it('shows a not-found error when the sale cannot be loaded', async () => {
    getSaleUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleNotFoundError()),
    );

    await store.load(999);

    expect(store.error()).toBe('No se encontro la venta solicitada.');
  });
});
