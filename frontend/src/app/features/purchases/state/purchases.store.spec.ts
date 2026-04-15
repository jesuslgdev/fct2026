import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import {
  CreatePurchasePayload,
  PurchaseDetail,
  PurchaseSort,
  PurchaseSummary,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { CancelPurchaseUseCase } from '@domain/usecases/purchase/cancel-purchase.usecase';
import { ChangePurchaseStatusUseCase } from '@domain/usecases/purchase/change-purchase-status.usecase';
import { CreatePurchaseUseCase } from '@domain/usecases/purchase/create-purchase.usecase';
import { DeletePurchaseUseCase } from '@domain/usecases/purchase/delete-purchase.usecase';
import { GetActivePurchaseSuppliersUseCase } from '@domain/usecases/purchase/get-active-purchase-suppliers.usecase';
import { GetDeliveryWarehousesUseCase } from '@domain/usecases/purchase/get-delivery-warehouses.usecase';
import { GetPurchaseByIdUseCase } from '@domain/usecases/purchase/get-purchase-by-id.usecase';
import { GetPurchasesUseCase } from '@domain/usecases/purchase/get-purchases.usecase';
import { GetSupplierProductsForPurchaseUseCase } from '@domain/usecases/purchase/get-supplier-products-for-purchase.usecase';
import { UpdatePurchaseUseCase } from '@domain/usecases/purchase/update-purchase.usecase';
import { PurchasesStore } from '@features/purchases/state/purchases.store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';

const PURCHASE_SUMMARY: PurchaseSummary = {
  purchaseId: 1,
  purchaseNumber: 'COM-2026-0001',
  supplierId: 10,
  supplierName: 'Supplier Alpha',
  deliveryWarehouseId: 3,
  deliveryAddress: 'Main Street 100',
  status: 'Pending',
  createdAt: '2026-04-01T08:00:00.000Z',
  total: 121,
};

const PURCHASE_DETAIL: PurchaseDetail = {
  ...PURCHASE_SUMMARY,
  subtotal: 100,
  vatTotal: 21,
  lines: [
    {
      lineId: 1,
      productId: 50,
      productName: 'Office Paper',
      quantity: 2,
      unitPrice: 50,
      vatRate: 21,
      subtotal: 100,
      vatAmount: 21,
      total: 121,
    },
  ],
  createdByUserId: 7,
  createdByName: 'Buyer User',
  updatedAt: null,
  cancelledAt: null,
  cancelledByUserId: null,
  cancelledByName: null,
  statusHistory: [
    {
      fromStatus: null,
      toStatus: 'Pending',
      changedAt: '2026-04-01T08:00:00.000Z',
      changedByUserId: 7,
      changedByName: 'Buyer User',
      effect: 'none',
    },
  ],
};

const SUPPLIERS: PurchaseSupplierOption[] = [
  {
    supplierId: 10,
    supplierName: 'Supplier Alpha',
    isActive: true,
  },
];

const WAREHOUSES: PurchaseWarehouseOption[] = [
  {
    warehouseId: 3,
    warehouseName: 'Central Warehouse',
    address: 'Main Street 100',
  },
];

const SUPPLIER_PRODUCTS: PurchaseSupplierProductOption[] = [
  {
    productId: 50,
    productName: 'Office Paper',
    supplierId: 10,
    unitPrice: 50,
    vatRate: 21,
  },
];

class MockAuthService {
  readonly user = signal({
    uid: '101',
    email: 'buyer@erp.test',
    displayName: 'Buyer User',
    photoURL: null,
    role: UserRole.Manager,
    departmentId: 2,
    permissions: [UserPermission.PurchasesManager],
  });

  hasPermission(permission: UserPermission | UserPermission[]): boolean {
    const permissions = this.user()?.permissions ?? [];
    const required = Array.isArray(permission) ? permission : [permission];
    return required.some((item) => permissions.includes(item));
  }
}

class MockGetPurchasesUseCase {
  execute = vi.fn<
    (params: unknown, permissionContext: unknown) =>
      Observable<{ data: PurchaseSummary[]; total: number; page: number; pageSize: number }>
  >();
}

class MockGetPurchaseByIdUseCase {
  execute = vi.fn<(purchaseId: number, permissionContext: unknown) => Observable<PurchaseDetail>>();
}

class MockCreatePurchaseUseCase {
  execute = vi.fn<(payload: CreatePurchasePayload, permissionContext: unknown) => Observable<PurchaseDetail>>();
}

class MockUpdatePurchaseUseCase {
  execute = vi.fn<
    (purchaseId: number, payload: UpdatePurchasePayload, permissionContext: unknown) => Observable<PurchaseDetail>
  >();
}

class MockDeletePurchaseUseCase {
  execute = vi.fn<(purchaseId: number, permissionContext: unknown) => Observable<void>>();
}

class MockCancelPurchaseUseCase {
  execute = vi.fn<(purchaseId: number, payload: unknown, permissionContext: unknown) => Observable<PurchaseDetail>>();
}

class MockChangePurchaseStatusUseCase {
  execute = vi.fn<(purchaseId: number, payload: unknown, permissionContext: unknown) => Observable<PurchaseDetail>>();
}

class MockGetActivePurchaseSuppliersUseCase {
  execute = vi.fn<(permissionContext: unknown) => Observable<PurchaseSupplierOption[]>>();
}

class MockGetDeliveryWarehousesUseCase {
  execute = vi.fn<(permissionContext: unknown) => Observable<PurchaseWarehouseOption[]>>();
}

class MockGetSupplierProductsForPurchaseUseCase {
  execute = vi.fn<(supplierId: number, permissionContext: unknown) => Observable<PurchaseSupplierProductOption[]>>();
}

describe('PurchasesStore', () => {
  let store: PurchasesStore;
  let getPurchasesUseCase: MockGetPurchasesUseCase;
  let getPurchaseByIdUseCase: MockGetPurchaseByIdUseCase;
  let createPurchaseUseCase: MockCreatePurchaseUseCase;
  let updatePurchaseUseCase: MockUpdatePurchaseUseCase;
  let deletePurchaseUseCase: MockDeletePurchaseUseCase;
  let cancelPurchaseUseCase: MockCancelPurchaseUseCase;
  let changePurchaseStatusUseCase: MockChangePurchaseStatusUseCase;
  let getActivePurchaseSuppliersUseCase: MockGetActivePurchaseSuppliersUseCase;
  let getDeliveryWarehousesUseCase: MockGetDeliveryWarehousesUseCase;
  let getSupplierProductsForPurchaseUseCase: MockGetSupplierProductsForPurchaseUseCase;

  beforeEach(() => {
    getPurchasesUseCase = new MockGetPurchasesUseCase();
    getPurchaseByIdUseCase = new MockGetPurchaseByIdUseCase();
    createPurchaseUseCase = new MockCreatePurchaseUseCase();
    updatePurchaseUseCase = new MockUpdatePurchaseUseCase();
    deletePurchaseUseCase = new MockDeletePurchaseUseCase();
    cancelPurchaseUseCase = new MockCancelPurchaseUseCase();
    changePurchaseStatusUseCase = new MockChangePurchaseStatusUseCase();
    getActivePurchaseSuppliersUseCase = new MockGetActivePurchaseSuppliersUseCase();
    getDeliveryWarehousesUseCase = new MockGetDeliveryWarehousesUseCase();
    getSupplierProductsForPurchaseUseCase = new MockGetSupplierProductsForPurchaseUseCase();

    // Default response to support catalog preloading side effects in loadFormOptions.
    getSupplierProductsForPurchaseUseCase.execute.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        PurchasesStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetPurchasesUseCase, useValue: getPurchasesUseCase },
        { provide: GetPurchaseByIdUseCase, useValue: getPurchaseByIdUseCase },
        { provide: CreatePurchaseUseCase, useValue: createPurchaseUseCase },
        { provide: UpdatePurchaseUseCase, useValue: updatePurchaseUseCase },
        { provide: DeletePurchaseUseCase, useValue: deletePurchaseUseCase },
        { provide: CancelPurchaseUseCase, useValue: cancelPurchaseUseCase },
        { provide: ChangePurchaseStatusUseCase, useValue: changePurchaseStatusUseCase },
        { provide: GetActivePurchaseSuppliersUseCase, useValue: getActivePurchaseSuppliersUseCase },
        { provide: GetDeliveryWarehousesUseCase, useValue: getDeliveryWarehousesUseCase },
        {
          provide: GetSupplierProductsForPurchaseUseCase,
          useValue: getSupplierProductsForPurchaseUseCase,
        },
      ],
    });

    store = TestBed.inject(PurchasesStore);
  });

  it('loads purchases successfully', () => {
    getPurchasesUseCase.execute.mockReturnValueOnce(
      of({
        data: [PURCHASE_SUMMARY],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    );

    store.loadPurchases();

    expect(getPurchasesUseCase.execute).toHaveBeenCalledOnce();
    expect(store.purchases()).toEqual([PURCHASE_SUMMARY]);
    expect(store.total()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets an error message when loading purchases fails', () => {
    getPurchasesUseCase.execute.mockReturnValueOnce(throwError(() => new Error('boom')));

    store.loadPurchases();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('boom');
  });

  it('loads suppliers and warehouses options', () => {
    getActivePurchaseSuppliersUseCase.execute.mockReturnValueOnce(of(SUPPLIERS));
    getDeliveryWarehousesUseCase.execute.mockReturnValueOnce(of(WAREHOUSES));

    store.loadFormOptions();

    expect(store.loadingOptions()).toBe(false);
    expect(store.suppliers()).toEqual(SUPPLIERS);
    expect(store.warehouses()).toEqual(WAREHOUSES);
  });

  it('loads supplier products', () => {
    getSupplierProductsForPurchaseUseCase.execute.mockReturnValueOnce(of(SUPPLIER_PRODUCTS));

    store.loadSupplierProducts(10);

    expect(getSupplierProductsForPurchaseUseCase.execute).toHaveBeenCalledWith(10, expect.any(Object));
    expect(store.loadingSupplierProducts()).toBe(false);
    expect(store.supplierProducts()).toEqual(SUPPLIER_PRODUCTS);
  });

  it('creates a purchase and reloads list', () => {
    getPurchasesUseCase.execute.mockReturnValue(of({
      data: [PURCHASE_SUMMARY],
      total: 1,
      page: 1,
      pageSize: 20,
    }));
    getActivePurchaseSuppliersUseCase.execute.mockReturnValueOnce(of(SUPPLIERS));
    getDeliveryWarehousesUseCase.execute.mockReturnValueOnce(of(WAREHOUSES));
    createPurchaseUseCase.execute.mockReturnValueOnce(of(PURCHASE_DETAIL));

    store.openCreateDialog();

    const payload: CreatePurchasePayload = {
      supplierId: 10,
      deliveryWarehouseId: 3,
      lines: [
        {
          productId: 50,
          quantity: 2,
          unitPrice: 50,
          vatRate: 21,
        },
      ],
    };

    store.savePurchase(payload);

    expect(createPurchaseUseCase.execute).toHaveBeenCalledWith(payload, expect.any(Object));
    expect(store.dialogVisible()).toBe(false);
    expect(store.loadingDetail()).toBe(false);
  });

  it('updates a purchase and reloads list', () => {
    getPurchaseByIdUseCase.execute.mockReturnValueOnce(of(PURCHASE_DETAIL));
    getActivePurchaseSuppliersUseCase.execute.mockReturnValueOnce(of(SUPPLIERS));
    getDeliveryWarehousesUseCase.execute.mockReturnValueOnce(of(WAREHOUSES));
    getSupplierProductsForPurchaseUseCase.execute.mockReturnValueOnce(of(SUPPLIER_PRODUCTS));
    updatePurchaseUseCase.execute.mockReturnValueOnce(of({ ...PURCHASE_DETAIL, supplierId: 11 }));
    getPurchasesUseCase.execute.mockReturnValue(of({
      data: [PURCHASE_SUMMARY],
      total: 1,
      page: 1,
      pageSize: 20,
    }));

    store.openEditDialog(PURCHASE_SUMMARY);

    const payload: UpdatePurchasePayload = {
      supplierId: 11,
      lines: PURCHASE_DETAIL.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
      })),
    };

    store.savePurchase(payload);

    expect(updatePurchaseUseCase.execute).toHaveBeenCalledWith(
      PURCHASE_DETAIL.purchaseId,
      payload,
      expect.any(Object),
    );
    expect(store.loadingDetail()).toBe(false);
  });

  it('deletes a purchase from list', () => {
    store.purchases.set([PURCHASE_SUMMARY]);
    store.total.set(1);
    deletePurchaseUseCase.execute.mockReturnValueOnce(of(undefined));

    store.requestDeletePurchase(PURCHASE_SUMMARY);
    store.confirmDeletePurchase();

    expect(deletePurchaseUseCase.execute).toHaveBeenCalledWith(PURCHASE_SUMMARY.purchaseId, expect.any(Object));
    expect(store.purchases()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.deleteConfirmVisible()).toBe(false);
  });

  it('cancels a purchase and updates its status', () => {
    const cancelled = { ...PURCHASE_DETAIL, status: 'Cancelled' as PurchaseStatus };

    store.purchases.set([PURCHASE_SUMMARY]);
    cancelPurchaseUseCase.execute.mockReturnValueOnce(of(cancelled));

    store.requestCancelPurchase(PURCHASE_SUMMARY);
    store.confirmCancelPurchase('Out of budget');

    expect(cancelPurchaseUseCase.execute).toHaveBeenCalledWith(
      PURCHASE_SUMMARY.purchaseId,
      expect.objectContaining({ cancelledByName: 'Buyer User' }),
      expect.any(Object),
    );
    expect(store.purchases()[0].status).toBe('Cancelled');
    expect(store.cancelConfirmVisible()).toBe(false);
  });

  it('changes purchase status', () => {
    const approved = { ...PURCHASE_DETAIL, status: 'Approved' as PurchaseStatus };

    store.purchases.set([PURCHASE_SUMMARY]);
    changePurchaseStatusUseCase.execute.mockReturnValueOnce(of(approved));

    store.requestStatusChange(PURCHASE_SUMMARY, 'Approved');
    store.confirmStatusChange();

    expect(changePurchaseStatusUseCase.execute).toHaveBeenCalledWith(
      PURCHASE_SUMMARY.purchaseId,
      expect.objectContaining({ toStatus: 'Approved' }),
      expect.any(Object),
    );
    expect(store.purchases()[0].status).toBe('Approved');
    expect(store.statusConfirmVisible()).toBe(false);
  });

  it('updates sort and reloads data', () => {
    getPurchasesUseCase.execute.mockReturnValue(of({
      data: [PURCHASE_SUMMARY],
      total: 1,
      page: 1,
      pageSize: 20,
    }));

    const sort: PurchaseSort = {
      field: 'total',
      direction: 'asc',
    };

    store.onSortChange(sort);

    expect(store.sort()).toEqual(sort);
    expect(store.page()).toBe(1);
    expect(getPurchasesUseCase.execute).toHaveBeenCalledOnce();
  });
});
