import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { UserRole } from '@domain/enums/user-role.enum';
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
  PurchaseInvalidStatusTransitionError,
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

const ALLOWED_CONTEXT: PurchasePermissionContext = {
  role: UserRole.Manager,
  departmentId: 2,
  purchasesDepartmentId: 2,
};

const FORBIDDEN_CONTEXT: PurchasePermissionContext = {
  role: UserRole.Employee,
  departmentId: 3,
  purchasesDepartmentId: 2,
};

const BASE_PURCHASE: PurchaseDetail = {
  purchaseId: 1,
  purchaseNumber: 'COM-2026-0001',
  supplierId: 10,
  supplierName: 'Proveedor Norte',
  deliveryWarehouseId: 2,
  deliveryAddress: 'Central',
  status: 'Pending',
  createdAt: '2026-04-01T08:00:00.000Z',
  total: 121,
  subtotal: 100,
  vatTotal: 21,
  lines: [
    {
      lineId: 1,
      productId: 100,
      productName: 'Tornillo M8',
      quantity: 2,
      unitPrice: 50,
      vatRate: 21,
      subtotal: 100,
      vatAmount: 21,
      total: 121,
    },
  ],
  createdByUserId: 1,
  createdByName: 'System',
  updatedAt: null,
  cancelledAt: null,
  cancelledByUserId: null,
  cancelledByName: null,
  statusHistory: [
    {
      fromStatus: null,
      toStatus: 'Pending',
      changedAt: '2026-04-01T08:00:00.000Z',
      changedByUserId: 1,
      changedByName: 'System',
      effect: 'none',
    },
  ],
};

const BASE_SUMMARY: PurchaseSummary = {
  purchaseId: BASE_PURCHASE.purchaseId,
  purchaseNumber: BASE_PURCHASE.purchaseNumber,
  supplierId: BASE_PURCHASE.supplierId,
  supplierName: BASE_PURCHASE.supplierName,
  deliveryWarehouseId: BASE_PURCHASE.deliveryWarehouseId,
  deliveryAddress: BASE_PURCHASE.deliveryAddress,
  status: BASE_PURCHASE.status,
  createdAt: BASE_PURCHASE.createdAt,
  total: BASE_PURCHASE.total,
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
    (
      purchaseId: number,
      payload: ChangePurchaseStatusPayload,
    ) => Observable<PurchaseDetail>
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
        CreatePurchaseUseCase,
        UpdatePurchaseUseCase,
        CancelPurchaseUseCase,
        DeletePurchaseUseCase,
        ChangePurchaseStatusUseCase,
        GetActivePurchaseSuppliersUseCase,
        GetDeliveryWarehousesUseCase,
        GetSupplierProductsForPurchaseUseCase,
        { provide: PurchaseRepository, useValue: repo },
      ],
    });
  });

  it('GetPurchasesUseCase normalizes and delegates to repository', async () => {
    const useCase = TestBed.inject(GetPurchasesUseCase);

    const params: PurchaseQueryParams = {
      page: 0,
      pageSize: 0,
    };

    const repositoryResponse: PagedResult<PurchaseSummary> = {
      data: [BASE_SUMMARY],
      total: 1,
      page: 1,
      pageSize: 20,
    };

    repo.getPurchases.mockReturnValueOnce(of(repositoryResponse));

    const result = await firstValueFrom(useCase.execute(params, ALLOWED_CONTEXT));

    expect(repo.getPurchases).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: { field: 'createdAt', direction: 'desc' },
    });
    expect(result).toEqual(repositoryResponse);
  });

  it('GetPurchasesUseCase rejects forbidden context', async () => {
    const useCase = TestBed.inject(GetPurchasesUseCase);

    await expect(
      firstValueFrom(useCase.execute({ page: 1, pageSize: 20 }, FORBIDDEN_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseForbiddenError);

    expect(repo.getPurchases).not.toHaveBeenCalled();
  });

  it('GetPurchaseByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetPurchaseByIdUseCase);

    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));

    const result = await firstValueFrom(useCase.execute(1, ALLOWED_CONTEXT));

    expect(repo.getPurchaseById).toHaveBeenCalledWith(1);
    expect(result).toEqual(BASE_PURCHASE);
  });

  it('CreatePurchaseUseCase validates and delegates to repository', async () => {
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

  it('CreatePurchaseUseCase throws validation error for invalid payload', async () => {
    const useCase = TestBed.inject(CreatePurchaseUseCase);

    const payload: CreatePurchasePayload = {
      supplierId: 0,
      deliveryWarehouseId: 2,
      lines: [{ productId: 100, quantity: 2, unitPrice: 50, vatRate: 21 }],
    };

    await expect(
      firstValueFrom(useCase.execute(payload, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseValidationError);

    expect(repo.createPurchase).not.toHaveBeenCalled();
  });

  it('UpdatePurchaseUseCase validates current status and delegates', async () => {
    const useCase = TestBed.inject(UpdatePurchaseUseCase);

    const payload: UpdatePurchasePayload = {
      deliveryWarehouseId: 3,
    };

    const updated: PurchaseDetail = {
      ...BASE_PURCHASE,
      deliveryWarehouseId: 3,
      deliveryAddress: 'North',
    };

    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));
    repo.updatePurchase.mockReturnValueOnce(of(updated));

    const result = await firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT));

    expect(repo.getPurchaseById).toHaveBeenCalledWith(1);
    expect(repo.updatePurchase).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('UpdatePurchaseUseCase rejects supplier change without lines', async () => {
    const useCase = TestBed.inject(UpdatePurchaseUseCase);

    const payload: UpdatePurchasePayload = {
      supplierId: 99,
    };

    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));

    await expect(
      firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseValidationError);

    expect(repo.updatePurchase).not.toHaveBeenCalled();
  });

  it('CancelPurchaseUseCase delegates when status is cancellable', async () => {
    const useCase = TestBed.inject(CancelPurchaseUseCase);

    const approvedPurchase: PurchaseDetail = {
      ...BASE_PURCHASE,
      status: 'Approved',
    };

    const payload: CancelPurchasePayload = {
      cancelledByUserId: 2,
      cancelledByName: 'Purchases Manager',
    };

    const cancelled: PurchaseDetail = {
      ...approvedPurchase,
      status: 'Cancelled',
      cancelledAt: '2026-04-03T10:00:00.000Z',
      cancelledByUserId: 2,
      cancelledByName: 'Purchases Manager',
    };

    repo.getPurchaseById.mockReturnValueOnce(of(approvedPurchase));
    repo.cancelPurchase.mockReturnValueOnce(of(cancelled));

    const result = await firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT));

    expect(repo.cancelPurchase).toHaveBeenCalledWith(1, payload);
    expect(result.status).toBe('Cancelled');
  });

  it('DeletePurchaseUseCase blocks delete when status is not pending', async () => {
    const useCase = TestBed.inject(DeletePurchaseUseCase);

    repo.getPurchaseById.mockReturnValueOnce(of({ ...BASE_PURCHASE, status: 'Approved' }));

    await expect(firstValueFrom(useCase.execute(1, ALLOWED_CONTEXT))).rejects.toBeInstanceOf(
      PurchaseBusinessRuleError,
    );

    expect(repo.deletePurchase).not.toHaveBeenCalled();
  });

  it('ChangePurchaseStatusUseCase delegates with valid transition', async () => {
    const useCase = TestBed.inject(ChangePurchaseStatusUseCase);

    const payload: ChangePurchaseStatusPayload = {
      toStatus: 'Approved',
      changedByUserId: 2,
      changedByName: 'Manager',
    };

    const approved: PurchaseDetail = {
      ...BASE_PURCHASE,
      status: 'Approved',
    };

    repo.getPurchaseById.mockReturnValueOnce(of(BASE_PURCHASE));
    repo.changePurchaseStatus.mockReturnValueOnce(of(approved));

    const result = await firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT));

    expect(repo.changePurchaseStatus).toHaveBeenCalledWith(1, payload);
    expect(result.status).toBe('Approved');
  });

  it('ChangePurchaseStatusUseCase rejects invalid transitions', async () => {
    const useCase = TestBed.inject(ChangePurchaseStatusUseCase);

    const payload: ChangePurchaseStatusPayload = {
      toStatus: 'Pending',
      changedByUserId: 2,
      changedByName: 'Manager',
    };

    repo.getPurchaseById.mockReturnValueOnce(of({ ...BASE_PURCHASE, status: 'Received' }));

    await expect(
      firstValueFrom(useCase.execute(1, payload, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseInvalidStatusTransitionError);

    expect(repo.changePurchaseStatus).not.toHaveBeenCalled();
  });

  it('GetActivePurchaseSuppliersUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetActivePurchaseSuppliersUseCase);

    const suppliers: PurchaseSupplierOption[] = [
      { supplierId: 1, supplierName: 'Proveedor Norte', isActive: true },
    ];

    repo.getActiveSuppliers.mockReturnValueOnce(of(suppliers));

    const result = await firstValueFrom(useCase.execute(ALLOWED_CONTEXT));

    expect(repo.getActiveSuppliers).toHaveBeenCalledOnce();
    expect(result).toEqual(suppliers);
  });

  it('GetDeliveryWarehousesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetDeliveryWarehousesUseCase);

    const warehouses: PurchaseWarehouseOption[] = [
      { warehouseId: 1, warehouseName: 'Central', address: 'Calle Mayor 1' },
    ];

    repo.getDeliveryWarehouses.mockReturnValueOnce(of(warehouses));

    const result = await firstValueFrom(useCase.execute(ALLOWED_CONTEXT));

    expect(repo.getDeliveryWarehouses).toHaveBeenCalledOnce();
    expect(result).toEqual(warehouses);
  });

  it('GetSupplierProductsForPurchaseUseCase validates supplier id', async () => {
    const useCase = TestBed.inject(GetSupplierProductsForPurchaseUseCase);

    await expect(
      firstValueFrom(useCase.execute(0, ALLOWED_CONTEXT)),
    ).rejects.toBeInstanceOf(PurchaseValidationError);

    expect(repo.getSupplierProducts).not.toHaveBeenCalled();
  });

  it('GetSupplierProductsForPurchaseUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetSupplierProductsForPurchaseUseCase);

    const products: PurchaseSupplierProductOption[] = [
      {
        productId: 100,
        productName: 'Tornillo M8',
        supplierId: 10,
        unitPrice: 50,
        vatRate: 21,
      },
    ];

    repo.getSupplierProducts.mockReturnValueOnce(of(products));

    const result = await firstValueFrom(useCase.execute(10, ALLOWED_CONTEXT));

    expect(repo.getSupplierProducts).toHaveBeenCalledWith(10);
    expect(result).toEqual(products);
  });
});
