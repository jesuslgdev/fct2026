import { describe, expect, it } from 'vitest';
import {
  assertCanViewPurchases,
  assertCanManagePurchases,
  assertPurchaseCanBeDeleted,
  assertPurchaseCanBeEdited,
  assertValidPurchaseStatusTransition,
  calculatePurchaseLineTotals,
  calculatePurchaseTotals,
  canManagePurchases,
  canViewPurchases,
  canTransitionPurchaseStatus,
  getAllowedNextPurchaseStatuses,
  getPurchaseStatusTransitionEffect,
  normalizePurchaseQueryParams,
  validateChangePurchaseStatusPayload,
  validateCreatePurchasePayload,
  validateLineUnitPricesAgainstSupplierCatalog,
  validateUpdatePurchasePayload,
} from '@domain/models/purchase-rules';
import {
  PurchaseBusinessRuleError,
  PurchaseForbiddenError,
  PurchaseInvalidStatusTransitionError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import {
  ChangePurchaseStatusPayload,
  PurchasePermissionContext,
  PurchaseQueryParams,
} from '@domain/models/purchase.model';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';

describe('purchase-rules', () => {
  it('returns allowed transitions for Pending', () => {
    const nextStatuses = getAllowedNextPurchaseStatuses('Pending');

    expect(nextStatuses).toEqual(['Approved', 'Cancelled']);
  });

  it('validates transition matrix correctly', () => {
    expect(canTransitionPurchaseStatus('Pending', 'Approved')).toBe(true);
    expect(canTransitionPurchaseStatus('Approved', 'Received')).toBe(false);
  });

  it('throws for invalid status transitions', () => {
    expect(() => assertValidPurchaseStatusTransition('Approved', 'Received')).toThrow(
      PurchaseInvalidStatusTransitionError,
    );
  });

  it('returns expected transition effects', () => {
    expect(getPurchaseStatusTransitionEffect('Pending', 'Approved')).toBe('freeze_lines');
    expect(getPurchaseStatusTransitionEffect('Sent', 'Received')).toBe(
      'generate_stock_entry',
    );
    expect(getPurchaseStatusTransitionEffect('Approved', 'Cancelled')).toBe('final_state');
    expect(getPurchaseStatusTransitionEffect('Approved', 'InProcess')).toBe('none');
  });

  it('enforces edit/delete guards by status', () => {
    expect(() => assertPurchaseCanBeEdited('Pending')).not.toThrow();
    expect(() => assertPurchaseCanBeEdited('Approved')).toThrow(PurchaseBusinessRuleError);

    expect(() => assertPurchaseCanBeDeleted('Pending')).not.toThrow();
    expect(() => assertPurchaseCanBeDeleted('Cancelled')).toThrow(PurchaseBusinessRuleError);
  });

  it('computes line totals and purchase totals', () => {
    const lineTotals = calculatePurchaseLineTotals({
      productId: 1,
      quantity: 2,
      unitPrice: 50,
      vatRate: 21,
    });

    expect(lineTotals).toEqual({
      subtotal: 100,
      vatAmount: 21,
      total: 121,
    });

    const totals = calculatePurchaseTotals([
      { productId: 1, quantity: 2, unitPrice: 50, vatRate: 21 },
      { productId: 2, quantity: 1, unitPrice: 10, vatRate: 10 },
    ]);

    expect(totals).toEqual({
      subtotal: 110,
      vatTotal: 22,
      total: 132,
    });
  });

  it('validates create payload fields', () => {
    expect(() =>
      validateCreatePurchasePayload({
        supplierId: 1,
        deliveryWarehouseId: 2,
        lines: [{ productId: 10, quantity: 1, unitPrice: 20, vatRate: 21 }],
      }),
    ).not.toThrow();

    expect(() =>
      validateCreatePurchasePayload({
        supplierId: 0,
        deliveryWarehouseId: 2,
        lines: [{ productId: 10, quantity: 1, unitPrice: 20, vatRate: 21 }],
      }),
    ).toThrow(PurchaseValidationError);

    expect(() =>
      validateCreatePurchasePayload({
        supplierId: 1,
        deliveryWarehouseId: 2,
        lines: [{ productId: 10, quantity: 1.5, unitPrice: 20, vatRate: 21 }],
      }),
    ).toThrow(PurchaseValidationError);
  });

  it('validates update payload cannot be empty', () => {
    expect(() => validateUpdatePurchasePayload({})).toThrow(PurchaseValidationError);
  });

  it('validates change status payload', () => {
    const validPayload: ChangePurchaseStatusPayload = {
      toStatus: 'Approved',
      changedByUserId: 1,
      changedByName: 'Manager',
    };

    expect(() => validateChangePurchaseStatusPayload(validPayload)).not.toThrow();

    const invalidPayload = {
      toStatus: 'UNKNOWN',
      changedByUserId: 1,
      changedByName: 'Manager',
    } as unknown as ChangePurchaseStatusPayload;

    expect(() => validateChangePurchaseStatusPayload(invalidPayload)).toThrow(
      PurchaseValidationError,
    );
  });

  it('validates line unit price is not lower than supplier purchase price', () => {
    expect(() =>
      validateLineUnitPricesAgainstSupplierCatalog(
        [{ productId: 10, quantity: 1, unitPrice: 20, vatRate: 21 }],
        [{ productId: 10, productName: 'Paper', supplierId: 1, unitPrice: 20, vatRate: 21 }],
      ),
    ).not.toThrow();

    expect(() =>
      validateLineUnitPricesAgainstSupplierCatalog(
        [{ productId: 10, quantity: 1, unitPrice: 19.99, vatRate: 21 }],
        [{ productId: 10, productName: 'Paper', supplierId: 1, unitPrice: 20, vatRate: 21 }],
      ),
    ).toThrow(PurchaseValidationError);
  });

  it('normalizes query params and validates date ranges', () => {
    const params: PurchaseQueryParams = {
      page: 0,
      pageSize: 0,
    };

    const normalized = normalizePurchaseQueryParams(params);
    expect(normalized.page).toBe(1);
    expect(normalized.pageSize).toBe(20);
    expect(normalized.sort).toEqual({ field: 'createdAt', direction: 'desc' });

    expect(() =>
      normalizePurchaseQueryParams({
        page: 1,
        pageSize: 20,
        createdFrom: '2026-12-31T00:00:00.000Z',
        createdTo: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow(PurchaseValidationError);
  });

  it('checks purchases permissions by context', () => {
    const adminContext: PurchasePermissionContext = {
      role: UserRole.Administrator,
      departmentId: null,
      purchasesDepartmentId: 2,
    };

    const managerContext: PurchasePermissionContext = {
      role: UserRole.Manager,
      departmentId: 2,
      purchasesDepartmentId: 2,
    };

    const forbiddenContext: PurchasePermissionContext = {
      role: UserRole.Employee,
      departmentId: 3,
      purchasesDepartmentId: 2,
    };

    expect(canManagePurchases(adminContext)).toBe(true);
    expect(canManagePurchases(managerContext)).toBe(true);
    expect(canManagePurchases(forbiddenContext)).toBe(false);

    expect(() => assertCanManagePurchases(forbiddenContext)).toThrow(PurchaseForbiddenError);
  });

  it('allows purchases access by explicit permissions', () => {
    const permissionContext: PurchasePermissionContext = {
      role: null,
      departmentId: null,
      purchasesDepartmentId: -1,
      permissions: [UserPermission.PurchasesDepartment],
    };

    expect(canManagePurchases(permissionContext)).toBe(true);
    expect(() => assertCanManagePurchases(permissionContext)).not.toThrow();
  });

  it('allows viewing purchases for authenticated contexts', () => {
    const authenticatedContext: PurchasePermissionContext = {
      role: UserRole.Employee,
      departmentId: 7,
      purchasesDepartmentId: -1,
      permissions: [],
    };

    expect(canViewPurchases(authenticatedContext)).toBe(true);
    expect(() => assertCanViewPurchases(authenticatedContext)).not.toThrow();
  });

  it('blocks viewing purchases for unauthenticated contexts', () => {
    const unauthenticatedContext: PurchasePermissionContext = {
      role: null,
      departmentId: null,
      purchasesDepartmentId: -1,
      permissions: [],
    };

    expect(canViewPurchases(unauthenticatedContext)).toBe(false);
    expect(() => assertCanViewPurchases(unauthenticatedContext)).toThrow(PurchaseForbiddenError);
  });
});
