import { describe, expect, it } from 'vitest';
import {
  PurchaseInvalidStatusTransitionError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import {
  assertValidPurchaseStatusTransition,
  calculatePurchaseLineTotals,
  calculatePurchaseTotals,
  canManagePurchases,
  canTransitionPurchaseStatus,
  getAllowedNextPurchaseStatuses,
  getPurchaseStatusTransitionEffect,
  normalizePurchaseQueryParams,
  shouldResetLinesWhenSupplierChanges,
  validateCreatePurchasePayload,
} from '@domain/models/purchase-rules';

describe('purchase-rules', () => {
  it('returns valid next statuses for Pending', () => {
    const nextStatuses = getAllowedNextPurchaseStatuses('Pending');

    expect(nextStatuses).toEqual(['Approved', 'Cancelled']);
  });

  it('accepts only configured status transitions', () => {
    expect(canTransitionPurchaseStatus('Pending', 'Approved')).toBe(true);
    expect(canTransitionPurchaseStatus('Pending', 'Received')).toBe(false);
  });

  it('throws for invalid status transition', () => {
    expect(() =>
      assertValidPurchaseStatusTransition('Approved', 'Received'),
    ).toThrow(PurchaseInvalidStatusTransitionError);
  });

  it('returns transition effect when purchase is received', () => {
    const effect = getPurchaseStatusTransitionEffect('Shipped', 'Received');

    expect(effect).toBe('generate_stock_entry');
  });

  it('detects supplier change to reset purchase lines', () => {
    expect(shouldResetLinesWhenSupplierChanges(10, 11)).toBe(true);
    expect(shouldResetLinesWhenSupplierChanges(10, 10)).toBe(false);
    expect(shouldResetLinesWhenSupplierChanges(10, undefined)).toBe(false);
  });

  it('calculates line totals with vat', () => {
    const totals = calculatePurchaseLineTotals({
      productId: 1,
      quantity: 2,
      unitPrice: 50,
      vatRate: 21,
    });

    expect(totals).toEqual({
      subtotal: 100,
      vatAmount: 21,
      total: 121,
    });
  });

  it('calculates aggregated totals for all lines', () => {
    const totals = calculatePurchaseTotals([
      {
        productId: 1,
        quantity: 2,
        unitPrice: 50,
        vatRate: 21,
      },
      {
        productId: 2,
        quantity: 1,
        unitPrice: 20,
        vatRate: 10,
      },
    ]);

    expect(totals).toEqual({
      subtotal: 120,
      vatTotal: 23,
      total: 143,
    });
  });

  it('validates create payload with mandatory lines', () => {
    expect(() =>
      validateCreatePurchasePayload({
        supplierId: 1,
        deliveryWarehouseId: 1,
        lines: [],
      }),
    ).toThrow(PurchaseValidationError);
  });

  it('normalizes invalid pagination and sort defaults', () => {
    const params = normalizePurchaseQueryParams({
      page: 0,
      pageSize: 0,
    });

    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(20);
    expect(params.sort).toEqual({ field: 'createdAt', direction: 'desc' });
  });

  it('allows purchases management for admin and purchases manager', () => {
    expect(
      canManagePurchases({
        role: 'Administrator',
        departmentId: null,
        purchasesDepartmentId: 5,
      }),
    ).toBe(true);

    expect(
      canManagePurchases({
        role: 'Manager',
        departmentId: 5,
        purchasesDepartmentId: 5,
      }),
    ).toBe(true);

    expect(
      canManagePurchases({
        role: 'Employee',
        departmentId: 3,
        purchasesDepartmentId: 5,
      }),
    ).toBe(false);
  });
});
