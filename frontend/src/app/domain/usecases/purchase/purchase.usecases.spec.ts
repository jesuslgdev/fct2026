import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  CancelPurchasePayload,
  ChangePurchaseStatusPayload,
  CreatePurchasePayload,
  PagedResult,
  PurchaseDetail,
  PurchasePermissionContext,
  PurchaseQueryParams,
  PurchaseSummary,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import {
  PurchaseBusinessRuleError,
  PurchaseForbiddenError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
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

const BASE_PURCHASE: PurchaseDetail = {
  purchaseId: 1,
  purchaseNumber: 'COM-2026-0001',
  supplierId: 10,
  supplierName: 'Proveedor Norte',
  deliveryWarehouseId: 2,
  deliveryAddress: 'Calle Mayor 21',
  status: 'Pending',
  createdAt: '2026-04-06T08:00:00.000Z',
  total: 121,
  subtotal: 100,
  vatTotal: 21,
  lines: [
    {
      lineId: 1,
      productId: 100,
      productName: 'Tornillos inox',
      quantity: 2,
      unitPrice: 50,
      vatRate: 21,
      subtotal: 100,
      vatAmount: 21,
      total: 121,
    },
  ],
  createdByUserId: 7,
  createdByName: 'Ana Lopez',
  updatedAt: null,
  cancelledAt: null,
  cancelledByUserId: null,
  cancelledByName: null,
  statusHistory: [
    {
      fromStatus: null,
      toStatus: 'Pending',
      changedAt: '2026-04-06T08:00:00.000Z',
      changedByUserId: 7,
      changedByName: 'Ana Lopez',
      effect: 'none',
    },
  ],
};

const ALLOWED_CONTEXT: PurchasePermissionContext = {
  role: 'Manager',
  departmentId: 9,
  purchasesDepartmentId: 9,
};

const DENIED_CONTEXT: PurchasePermissionContext = {
  role: 'Employee',
  departmentId: 4,
  purchasesDepartmentId: 9,
};

class MockPurchaseRepository implements PurchaseRepository {
  getPurchases = vi.fn<
    (params: PurchaseQueryParams) => Observable<PagedResult<PurchaseSummary>>
  >();

  getPurchaseById = vi.fn<(purchaseId: number) => Observable<PurchaseDetail>>();

  createPurchase = vi.fn<
    (payload: CreatePurchasePayload) => Observable<PurchaseDetail>
  >();

  updatePurchase = vi.fn<
    (purchaseId: number, payload: UpdatePurchasePayload) => Observable<PurchaseDetail>
  >();

  cancelPurchase = vi.fn<
    (purchaseId: number, payload: CancelPurchasePayload) => Observable<PurchaseDetail>
  >();

  deletePurchase = vi.fn<(purchaseId: number) => Observable<void>>();

  changePurchaseStatus = vi.fn<
    (purchaseId: number, payload: ChangePurchaseStatusPayload) => Observable<PurchaseDetail>
  >();

  getActiveSuppliers = vi.fn<() => Observable<PurchaseSupplierOption[]>>();

  getDeliveryWarehouses = vi.fn<() => Observable<PurchaseWarehouseOption[]>>();

  getSupplierProducts = vi.fn<
    (supplierId: number) => Observable<PurchaseSupplierProductOption[]>
  >();
}

describe('Purchase Use Cases', () => {
  let repo: MockPurchaseRepository;

  beforeEach(() => {
    repo = new MockPurchaseRepository();

    TestBed.configureTestingModule({
      providers: [
        GetPurchasesUseCase,
        GetPurchaseByIdUseCase,
        GetActivePurchaseSuppliersUseCase,
        GetDeliveryWarehousesUseCase,
        GetSupplierProductsForPurchaseUseCase,
        CreatePurchaseUseCase,
        UpdatePurchaseUseCase,
        CancelPurchaseUseCase,
        DeletePurchaseUseCase,
        ChangePurchaseStatusUseCase,
        { provide: PurchaseRepository, useValue: repo },
      ],
    });
  });

  it('GetPurchasesUseCase normalizes default pagination and sorting', async () => {
    const useCase = TestBed.inject(GetPurchasesUseCase);
    const paged: PagedResult<PurchaseSummary> = {
      data: [BASE_PURCHASE],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    repo.getPurchases.mockReturnValueOnce(of(paged));

    const result = await firstValueFrom(useCase.execute({ page: 0, pageSize: 0 }));

    expect(repo.getPurchases).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: { field: 'createdAt', direction: 'desc' },
    });
    expect(result).toEqual(paged);
  });

  it('GetPurchaseByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetPurchaseByIdUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));

    const result = await firstValueFrom(useCase.execute(1));

    expect(repo.getPurchaseById).toHaveBeenCalledWith(1);
    expect(result).toEqual(BASE_PURCHASE);
  });

  it('GetActivePurchaseSuppliersUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetActivePurchaseSuppliersUseCase);
    const suppliers: PurchaseSupplierOption[] = [
      { supplierId: 10, supplierName: 'Proveedor Norte', isActive: true },
    ];
    repo.getActiveSuppliers.mockReturnValueOnce(of(suppliers));

    const result = await firstValueFrom(useCase.execute());

    expect(repo.getActiveSuppliers).toHaveBeenCalledOnce();
    expect(result).toEqual(suppliers);
  });

  it('GetDeliveryWarehousesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetDeliveryWarehousesUseCase);
    const warehouses: PurchaseWarehouseOption[] = [
      { warehouseId: 2, warehouseName: 'Central', address: 'Calle Mayor 21' },
    ];
    repo.getDeliveryWarehouses.mockReturnValueOnce(of(warehouses));

    const result = await firstValueFrom(useCase.execute());

    expect(repo.getDeliveryWarehouses).toHaveBeenCalledOnce();
    expect(result).toEqual(warehouses);
  });

  it('GetSupplierProductsForPurchaseUseCase validates supplier id', () => {
    const useCase = TestBed.inject(GetSupplierProductsForPurchaseUseCase);

    return expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      PurchaseValidationError,
    );
  });

  it('CreatePurchaseUseCase blocks unauthorized users', async () => {
    const useCase = TestBed.inject(CreatePurchaseUseCase);
    const payload: CreatePurchasePayload = {
      supplierId: 10,
      deliveryWarehouseId: 2,
      lines: [{ productId: 100, quantity: 2, unitPrice: 50, vatRate: 21 }],
    };

    await expect(
      firstValueFrom(useCase.execute(payload, DENIED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseForbiddenError);
    expect(repo.createPurchase).not.toHaveBeenCalled();
  });

  it('CreatePurchaseUseCase delegates when payload and permissions are valid', async () => {
    const useCase = TestBed.inject(CreatePurchaseUseCase);
    const payload: CreatePurchasePayload = {
      supplierId: 10,
      deliveryWarehouseId: 2,
      lines: [{ productId: 100, quantity: 2, unitPrice: 50, vatRate: 21 }],
    };
    repo.createPurchase.mockReturnValueOnce(of(BASE_PURCHASE));

    const result = await firstValueFrom(useCase.execute(payload, ALLOWED_CONTEXT));

    expect(repo.createPurchase).toHaveBeenCalledWith(payload);
    expect(result).toEqual(BASE_PURCHASE);
  });

  it('UpdatePurchaseUseCase blocks non pending purchases', async () => {
    const useCase = TestBed.inject(UpdatePurchaseUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of({
      ...BASE_PURCHASE,
      status: 'Approved',
    }));

    await expect(
      firstValueFrom(useCase.execute(1, { deliveryWarehouseId: 3 }, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseBusinessRuleError);

    expect(repo.updatePurchase).not.toHaveBeenCalled();
  });

  it('UpdatePurchaseUseCase requires lines when supplier changes', async () => {
    const useCase = TestBed.inject(UpdatePurchaseUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));

    await expect(
      firstValueFrom(useCase.execute(1, { supplierId: 11 }, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseValidationError);

    expect(repo.updatePurchase).not.toHaveBeenCalled();
  });

  it('CancelPurchaseUseCase allows only Pending or Approved statuses', async () => {
    const useCase = TestBed.inject(CancelPurchaseUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of({
      ...BASE_PURCHASE,
      status: 'InProcess',
    }));

    await expect(
      firstValueFrom(useCase.execute(
        1,
        { cancelledByUserId: 7, cancelledByName: 'Ana Lopez' },
        ALLOWED_CONTEXT,
      )),
    ).rejects.toBeInstanceOf(PurchaseBusinessRuleError);

    expect(repo.cancelPurchase).not.toHaveBeenCalled();
  });

  it('DeletePurchaseUseCase allows deletion only in Pending', async () => {
    const useCase = TestBed.inject(DeletePurchaseUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of({
      ...BASE_PURCHASE,
      status: 'Approved',
    }));

    await expect(
      firstValueFrom(useCase.execute(1, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseBusinessRuleError);

    expect(repo.deletePurchase).not.toHaveBeenCalled();
  });

  it('ChangePurchaseStatusUseCase delegates with valid transition', async () => {
    const useCase = TestBed.inject(ChangePurchaseStatusUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));
    const payload: ChangePurchaseStatusPayload = {
      toStatus: 'Approved',
      changedByUserId: 7,
      changedByName: 'Ana Lopez',
    };
    repo.changePurchaseStatus.mockReturnValueOnce(of({
      ...BASE_PURCHASE,
      status: 'Approved',
    }));

    const result = await firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT));

    expect(repo.changePurchaseStatus).toHaveBeenCalledWith(1, payload);
    expect(result.status).toBe('Approved');
  });

  it('ChangePurchaseStatusUseCase rejects invalid transitions', async () => {
    const useCase = TestBed.inject(ChangePurchaseStatusUseCase);
    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));

    await expect(
      firstValueFrom(useCase.execute(
        1,
        {
          toStatus: 'Received',
          changedByUserId: 7,
          changedByName: 'Ana Lopez',
        },
        ALLOWED_CONTEXT,
      )),
    ).rejects.toBeInstanceOf(PurchaseBusinessRuleError);

    expect(repo.changePurchaseStatus).not.toHaveBeenCalled();
  });
});
