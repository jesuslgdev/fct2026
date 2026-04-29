import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { Client, ClientDetail } from '@domain/models/client.model';
import { Product, ProductStockByWarehouse } from '@domain/models/product.model';
import { SaleInsufficientStockError } from '@domain/models/sale-errors';
import { SaleDetail } from '@domain/models/sale.model';
import { Warehouse } from '@domain/models/warehouse.model';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { GetProductStockByWarehousesUseCase } from '@domain/usecases/product/get-product-stock-by-warehouses.usecase';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { CreateSaleUseCase } from '@domain/usecases/sales/create-sale.usecase';
import { GetSaleUseCase } from '@domain/usecases/sales/get-sale.usecase';
import { UpdateSaleUseCase } from '@domain/usecases/sales/update-sale.usecase';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';
import { SaleCreateStore } from './sale-create.store';
import { SaleStatus } from '@domain/enums/sale-status.enum';

const CLIENTE_A: Client = {
  clientId: 1,
  name: 'Cliente A',
  taxId: 'A123',
  city: 'Madrid',
  isActive: true,
};

const CLIENTE_DETALLE_A: ClientDetail = {
  ...CLIENTE_A,
  address: 'Gran Via 1',
  province: 'Madrid',
  postalCode: '28001',
  phone: '600000000',
  email: 'cliente@example.com',
};

const ALMACEN_A: Warehouse = {
  warehouseId: 10,
  name: 'Almacen principal',
  address: 'Calle Almacen 1',
  addressData: {
    street: 'Calle Almacen 1',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28002',
  },
  totalStock: 100,
};

const PRODUCTO_A: Product = {
  productId: 100,
  code: 'P-100',
  name: 'Producto A',
  description: 'Descripcion del producto A',
  categoryId: 1,
  categoryName: 'Categoria',
  price: 10,
  vatRate: 0.21,
  stock: 30,
  minStock: 5,
  isActive: true,
};

const PRODUCTO_B: Product = {
  productId: 200,
  code: 'P-200',
  name: 'Producto B',
  description: 'Descripcion del producto B',
  categoryId: 1,
  categoryName: 'Categoria',
  price: 20,
  vatRate: 0.1,
  stock: 50,
  minStock: 5,
  isActive: true,
};

const STOCK_PRODUCTO_A: ProductStockByWarehouse[] = [
  {
    warehouseId: 10,
    warehouseName: 'Almacen principal',
    currentStock: 8,
    minStock: 5,
    status: 'normal',
  },
];

const SALE_DETAIL: SaleDetail = {
  saleId: 77,
  saleNumber: 'VEN-2026-0077',
  clientId: 1,
  warehouseId: 10,
  clientName: 'Cliente A',
  creatorName: 'Administrador',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED],
  deliveryAddress: 'Direccion editada',
  saleDate: new Date('2026-04-01T10:00:00.000Z'),
  createdAt: new Date('2026-04-01T10:01:00.000Z'),
  updatedAt: new Date('2026-04-01T10:02:00.000Z'),
  userId: 1,
  subtotal: 9.5,
  taxes: 1.995,
  total: 11.495,
  lines: [
    {
      saleLineId: 501,
      saleId: 77,
      productId: 100,
      quantity: 1,
      unitPrice: 10,
      discount: 0.05,
      lineSubtotal: 9.5,
      vatRate: 0.21,
      lineTax: 1.995,
    },
  ],
  statusHistory: [],
};

class MockGetClientsUseCase {
  execute = vi.fn().mockReturnValue(
    of({
      data: [CLIENTE_A],
      total: 1,
      page: 1,
      pageSize: 100,
    }),
  );
}

class MockGetClientByIdUseCase {
  execute = vi.fn().mockReturnValue(of(CLIENTE_DETALLE_A));
}

class MockGetWarehousesUseCase {
  execute = vi.fn().mockReturnValue(of([ALMACEN_A]));
}

class MockGetProductsUseCase {
  execute = vi.fn().mockReturnValue(
    of({
      data: [PRODUCTO_A, PRODUCTO_B],
      total: 2,
      page: 1,
      pageSize: 100,
    }),
  );
}

class MockGetProductStockByWarehousesUseCase {
  execute = vi.fn().mockImplementation((productId: number) => {
    if (productId === PRODUCTO_A.productId) {
      return of(STOCK_PRODUCTO_A);
    }

    return of([
      {
        warehouseId: 10,
        warehouseName: 'Almacen principal',
        currentStock: 15,
        minStock: 5,
        status: 'normal',
      },
    ] satisfies ProductStockByWarehouse[]);
  });
}

class MockCreateSaleUseCase {
  execute = vi.fn().mockReturnValue(of({ saleId: 99 }));
}

class MockGetSaleUseCase {
  execute = vi.fn().mockReturnValue(of(SALE_DETAIL));
}

class MockUpdateSaleUseCase {
  execute = vi.fn().mockReturnValue(of(SALE_DETAIL));
}

describe('SaleCreateStore', () => {
  let store: SaleCreateStore;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let getClientByIdUseCase: MockGetClientByIdUseCase;
  let createSaleUseCase: MockCreateSaleUseCase;
  let getSaleUseCase: MockGetSaleUseCase;
  let updateSaleUseCase: MockUpdateSaleUseCase;

  beforeEach(() => {
    router = { navigate: vi.fn().mockResolvedValue(true) };
    getClientByIdUseCase = new MockGetClientByIdUseCase();
    createSaleUseCase = new MockCreateSaleUseCase();
    getSaleUseCase = new MockGetSaleUseCase();
    updateSaleUseCase = new MockUpdateSaleUseCase();

    TestBed.configureTestingModule({
      providers: [
        SaleCreateStore,
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: {
            isAdmin: signal(true),
            user: signal({
              uid: 'uid-1',
              email: 'admin@example.com',
              displayName: 'Administrador',
              photoURL: null,
              role: 'Administrator',
              departmentId: null,
              permissions: [],
            }),
          },
        },
        { provide: GetClientsUseCase, useValue: new MockGetClientsUseCase() },
        { provide: GetClientByIdUseCase, useValue: getClientByIdUseCase },
        { provide: GetWarehousesUseCase, useValue: new MockGetWarehousesUseCase() },
        { provide: GetProductsUseCase, useValue: new MockGetProductsUseCase() },
        {
          provide: GetProductStockByWarehousesUseCase,
          useValue: new MockGetProductStockByWarehousesUseCase(),
        },
        { provide: CreateSaleUseCase, useValue: createSaleUseCase },
        { provide: GetSaleUseCase, useValue: getSaleUseCase },
        { provide: UpdateSaleUseCase, useValue: updateSaleUseCase },
      ],
    });

    store = TestBed.inject(SaleCreateStore);
  });

  it('loads clients, warehouses, products, and an initial empty line', async () => {
    await store.initialize();

    expect(store.clients()).toEqual([CLIENTE_A]);
    expect(store.warehouses()).toEqual([ALMACEN_A]);
    expect(store.products()).toEqual([PRODUCTO_A, PRODUCTO_B]);
    expect(store.lines()).toHaveLength(1);
  });

  it('builds the delivery address from client details', async () => {
    await store.initialize();

    await store.onClientChange(1);

    expect(getClientByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.deliveryAddress()).toBe('Gran Via 1, Madrid, Madrid, 28001');
  });

  it('only allows editing lines when client and warehouse are selected', async () => {
    await store.initialize();

    expect(store.canEditLines()).toBe(false);

    await store.onClientChange(1);
    expect(store.canEditLines()).toBe(false);

    await store.onWarehouseChange(10);
    expect(store.canEditLines()).toBe(true);
  });

  it('recalculates subtotal, VAT, and total when a line changes', async () => {
    await store.initialize();

    const lineId = store.lines()[0].lineId;

    await store.onWarehouseChange(10);
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 2,
      discount: 10,
      discountType: 'percent',
    });

    const [line] = store.lineViews();
    expect(line.availableStock).toBe(8);
    expect(line.lineSubtotal).toBe(18);
    expect(line.lineTax).toBeCloseTo(3.78);
    expect(store.subtotal()).toBe(18);
    expect(store.taxes()).toBeCloseTo(3.78);
    expect(store.total()).toBeCloseTo(21.78);
  });

  it('previews subtotal, VAT, and total while editing an unsaved line', async () => {
    await store.initialize();
    await store.onWarehouseChange(10);

    const lineId = store.lines()[0].lineId;

    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
    });

    store.startLineEdit(store.lines()[0]);
    store.onDraftQuantityChange(lineId, '3');
    store.onDraftDiscountChange(lineId, '5');
    store.onDraftDiscountTypeChange(lineId, 'amount');

    const line = store.getLineView(lineId);

    expect(line?.lineSubtotal).toBe(25);
    expect(line?.lineTax).toBeCloseTo(5.25);
    expect(store.subtotal()).toBe(25);
    expect(store.taxes()).toBeCloseTo(5.25);
    expect(store.total()).toBeCloseTo(30.25);
    expect(store.lines()[0].quantity).toBe(1);
    expect(store.lines()[0].discount).toBe(0);
  });

  it('reverts the preview when cancelling line editing', async () => {
    await store.initialize();
    await store.onWarehouseChange(10);

    const lineId = store.lines()[0].lineId;

    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 2,
      discount: 10,
      discountType: 'percent',
    });

    const totalAntesDeEditar = store.total();

    store.startLineEdit(store.lines()[0]);
    store.onDraftDiscountChange(lineId, '0');
    store.onDraftQuantityChange(lineId, '4');

    expect(store.total()).not.toBe(totalAntesDeEditar);

    store.cancelLineEdit(lineId);

    expect(store.total()).toBeCloseTo(totalAntesDeEditar);
    expect(store.getLineDraft(lineId)).toBeUndefined();
  });
  it('marks the line as invalid when quantity exceeds available stock', async () => {
    await store.initialize();

    const lineId = store.lines()[0].lineId;

    await store.onWarehouseChange(10);
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 12,
      discount: 0,
      discountType: 'percent',
    });

    expect(store.lineViews()[0].validationError).toBe('La cantidad no puede superar el stock disponible.');
    expect(store.canSubmit()).toBe(false);
  });

  it('submits the correct payload and redirects to the list', async () => {
    await store.initialize();
    await store.onClientChange(1);
    await store.onWarehouseChange(10);

    const lineId = store.lines()[0].lineId;
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 2,
      discount: 5,
      discountType: 'amount',
    });

    await store.submit();

    expect(createSaleUseCase.execute).toHaveBeenCalledWith({
      clientId: 1,
      warehouseId: 10,
      lines: [
        {
          productId: 100,
          quantity: 2,
          discount: 5,
          discountType: 'amount',
        },
      ],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/sales']);
  });

  it('disables submit while a line is being edited', async () => {
    await store.initialize();
    await store.onClientChange(1);
    await store.onWarehouseChange(10);

    const lineId = store.lines()[0].lineId;
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
    });

    store.startLineEdit(store.lines()[0]);
    store.onDraftQuantityChange(lineId, '2');

    expect(store.canSubmit()).toBe(false);
  });
  it('maps the insufficient stock error to a Spanish message', async () => {
    await store.initialize();
    await store.onClientChange(1);
    await store.onWarehouseChange(10);

    const lineId = store.lines()[0].lineId;
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
    });

    createSaleUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleInsufficientStockError()),
    );

    await store.submit();

    expect(store.error()).toBe('Una o varias lineas no tienen stock suficiente.');
  });
  it('loads a pending sale for editing in the create form', async () => {
    await store.initializeForEdit(77);

    expect(getSaleUseCase.execute).toHaveBeenCalledWith(77);
    expect(store.isEditMode()).toBe(true);
    expect(store.editingSaleId()).toBe(77);
    expect(store.editingSaleNumber()).toBe('VEN-2026-0077');
    expect(store.selectedClientId()).toBe(1);
    expect(store.selectedWarehouseId()).toBe(10);
    expect(store.deliveryAddress()).toBe('Direccion editada');
    expect(store.lines()[0]).toMatchObject({
      productId: 100,
      quantity: 1,
      discount: 0.5,
      discountType: 'amount',
    });
  });

  it('preserves the effective discount when resubmitting an edited sale without a discount type in the detail', async () => {
    await store.initializeForEdit(77);

    await store.submit();

    expect(updateSaleUseCase.execute).toHaveBeenCalledWith(77, {
      clientId: 1,
      deliveryAddress: 'Direccion editada',
      lines: [
        {
          productId: 100,
          quantity: 1,
          discount: 0.5,
          discountType: 'amount',
        },
      ],
    });
  });

  it('rehydrates percentage discounts when the detail includes their type', async () => {
    getSaleUseCase.execute.mockReturnValueOnce(
      of({
        ...SALE_DETAIL,
        lines: [
          {
            ...SALE_DETAIL.lines[0],
            discountType: 'percent',
          },
        ],
      }),
    );

    await store.initializeForEdit(77);

    expect(store.lines()[0]).toMatchObject({
      productId: 100,
      quantity: 1,
      discount: 5,
      discountType: 'percent',
    });
  });

  it('submits the update payload and redirects to the detail page', async () => {
    await store.initializeForEdit(77);
    store.onDeliveryAddressChange('Nueva direccion');

    const lineId = store.lines()[0].lineId;
    await store.commitLineEdit(lineId, {
      productId: 100,
      quantity: 2,
      discount: 10,
      discountType: 'percent',
    });

    await store.submit();

    expect(updateSaleUseCase.execute).toHaveBeenCalledWith(77, {
      clientId: 1,
      deliveryAddress: 'Nueva direccion',
      lines: [
        {
          productId: 100,
          quantity: 2,
          discount: 10,
          discountType: 'percent',
        },
      ],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/sales', 77]);
  });
  it('marks the line as invalid when a duplicate product is confirmed', async () => {
    await store.initialize();
    await store.onWarehouseChange(10);

    const [firstLine] = store.lines();
    store.addLine();
    const secondLine = store.lines()[1];

    await store.commitLineEdit(firstLine.lineId, {
      productId: 100,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
    });

    await store.commitLineEdit(secondLine.lineId, {
      productId: 100,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
    });

    expect(store.lineViews()[1].validationError).toBe('Este producto ya esta anadido en otra linea.');
    expect(store.canSubmit()).toBe(false);
  });
});
