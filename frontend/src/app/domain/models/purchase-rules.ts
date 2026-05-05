import {
  FINAL_PURCHASE_STATUSES,
  PURCHASE_STATUSES,
  PurchaseStatus,
} from '@domain/enums/purchase-status.enum';
import {
  ChangePurchaseStatusPayload,
  CreatePurchasePayload,
  DEFAULT_PURCHASES_PAGE_SIZE,
  DEFAULT_PURCHASES_SORT,
  PurchaseLineInput,
  PurchaseLineTotals,
  PurchasePermissionContext,
  PurchaseQueryParams,
  PurchaseSortField,
  PurchaseStatusTransitionEffect,
  PurchaseSupplierProductOption,
  PurchaseTotals,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import {
  PurchaseBusinessRuleError,
  PurchaseForbiddenError,
  PurchaseInvalidStatusTransitionError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';

const PURCHASE_STATUS_TRANSITIONS: Record<PurchaseStatus, readonly PurchaseStatus[]> = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['InProcess', 'Cancelled'],
  InProcess: ['Sent'],
  Sent: ['Received'],
  Received: [],
  Cancelled: [],
};

const PURCHASE_SORT_FIELDS: readonly PurchaseSortField[] = [
  'purchaseNumber',
  'supplierName',
  'status',
  'deliveryAddress',
  'createdAt',
  'total',
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new PurchaseValidationError(
      { field: fieldName, value },
      `${fieldName} must be a positive integer.`,
    );
  }
}

function assertNonEmptyString(value: string, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new PurchaseValidationError(
      { field: fieldName, value },
      `${fieldName} is required.`,
    );
  }
}

function parseIsoDate(value: string | undefined, fieldName: string): Date | null {
  if (value === undefined) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new PurchaseValidationError(
      { field: fieldName, value },
      `${fieldName} must be a valid ISO date.`,
    );
  }

  return parsed;
}

export function assertPositivePurchaseId(purchaseId: number): void {
  assertPositiveInteger(purchaseId, 'purchaseId');
}

export function assertPositiveSupplierId(supplierId: number): void {
  assertPositiveInteger(supplierId, 'supplierId');
}

export function isFinalPurchaseStatus(status: PurchaseStatus): boolean {
  return FINAL_PURCHASE_STATUSES.includes(status);
}

export function getAllowedNextPurchaseStatuses(status: PurchaseStatus): PurchaseStatus[] {
  return [...PURCHASE_STATUS_TRANSITIONS[status]];
}

export function canTransitionPurchaseStatus(
  fromStatus: PurchaseStatus,
  toStatus: PurchaseStatus,
): boolean {
  return PURCHASE_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertValidPurchaseStatusTransition(
  fromStatus: PurchaseStatus,
  toStatus: PurchaseStatus,
): void {
  if (!canTransitionPurchaseStatus(fromStatus, toStatus)) {
    throw new PurchaseInvalidStatusTransitionError(fromStatus, toStatus);
  }
}

export function getPurchaseStatusTransitionEffect(
  fromStatus: PurchaseStatus,
  toStatus: PurchaseStatus,
): PurchaseStatusTransitionEffect {
  if (fromStatus === 'Pending' && toStatus === 'Approved') {
    return 'freeze_lines';
  }

  if (toStatus === 'Cancelled') {
    return 'final_state';
  }

  if (fromStatus === 'Sent' && toStatus === 'Received') {
    return 'generate_stock_entry';
  }

  return 'none';
}

export function canEditPurchase(status: PurchaseStatus): boolean {
  return status === 'Pending';
}

export function arePurchaseLinesEditable(status: PurchaseStatus): boolean {
  return status === 'Pending';
}

export function canCancelPurchase(status: PurchaseStatus): boolean {
  return status === 'Pending' || status === 'Approved';
}

export function canDeletePurchase(status: PurchaseStatus): boolean {
  return status === 'Pending';
}

export function assertPurchaseCanBeEdited(status: PurchaseStatus): void {
  if (!canEditPurchase(status)) {
    throw new PurchaseBusinessRuleError('Only purchases in Pending status can be edited.');
  }
}

export function assertPurchaseCanBeCancelled(status: PurchaseStatus): void {
  if (!canCancelPurchase(status)) {
    throw new PurchaseBusinessRuleError(
      'Only purchases in Pending or Approved status can be cancelled.',
    );
  }
}

export function assertPurchaseCanBeDeleted(status: PurchaseStatus): void {
  if (!canDeletePurchase(status)) {
    throw new PurchaseBusinessRuleError('Only purchases in Pending status can be deleted.');
  }
}

export function shouldResetLinesWhenSupplierChanges(
  currentSupplierId: number,
  nextSupplierId: number | undefined,
): boolean {
  if (nextSupplierId === undefined) {
    return false;
  }

  return currentSupplierId !== nextSupplierId;
}

export function canManagePurchases(context: PurchasePermissionContext): boolean {
  const permissions = context.permissions ?? [];
  if (
    permissions.includes(UserPermission.Admin)
    || permissions.includes(UserPermission.PurchasesManager)
    || permissions.includes(UserPermission.PurchasesDepartment)
  ) {
    return true;
  }

  if (context.role === UserRole.Administrator) {
    return true;
  }

  if (context.purchasesDepartmentId <= 0 || context.departmentId == null) {
    return false;
  }

  const isPurchasesDepartment = context.departmentId === context.purchasesDepartmentId;
  const isAllowedRole = context.role === UserRole.Employee || context.role === UserRole.Manager;

  return isPurchasesDepartment && isAllowedRole;
}

export function assertCanManagePurchases(context: PurchasePermissionContext): void {
  if (!canManagePurchases(context)) {
    throw new PurchaseForbiddenError();
  }
}

export function validatePurchaseLineInput(line: PurchaseLineInput, index: number): void {
  assertPositiveInteger(line.productId, `lines[${index}].productId`);

  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    throw new PurchaseValidationError(
      { field: `lines[${index}].quantity`, value: line.quantity },
      `lines[${index}].quantity must be greater than zero.`,
    );
  }

  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
    throw new PurchaseValidationError(
      { field: `lines[${index}].unitPrice`, value: line.unitPrice },
      `lines[${index}].unitPrice must be greater than or equal to zero.`,
    );
  }

  if (!Number.isFinite(line.vatRate) || line.vatRate < 0 || line.vatRate > 100) {
    throw new PurchaseValidationError(
      { field: `lines[${index}].vatRate`, value: line.vatRate },
      `lines[${index}].vatRate must be between 0 and 100.`,
    );
  }
}

export function validatePurchaseLines(lines: PurchaseLineInput[]): void {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new PurchaseValidationError(
      { field: 'lines', value: lines },
      'At least one purchase line is required.',
    );
  }

  lines.forEach((line, index) => validatePurchaseLineInput(line, index));
}

export function calculatePurchaseLineTotals(line: PurchaseLineInput): PurchaseLineTotals {
  validatePurchaseLineInput(line, 0);

  const subtotal = roundCurrency(line.quantity * line.unitPrice);
  const vatAmount = roundCurrency(subtotal * (line.vatRate / 100));
  const total = roundCurrency(subtotal + vatAmount);

  return {
    subtotal,
    vatAmount,
    total,
  };
}

export function calculatePurchaseTotals(lines: PurchaseLineInput[]): PurchaseTotals {
  validatePurchaseLines(lines);

  return lines.reduce<PurchaseTotals>(
    (accumulator, line) => {
      const totals = calculatePurchaseLineTotals(line);
      return {
        subtotal: roundCurrency(accumulator.subtotal + totals.subtotal),
        vatTotal: roundCurrency(accumulator.vatTotal + totals.vatAmount),
        total: roundCurrency(accumulator.total + totals.total),
      };
    },
    {
      subtotal: 0,
      vatTotal: 0,
      total: 0,
    },
  );
}

export function validateCreatePurchasePayload(payload: CreatePurchasePayload): void {
  assertPositiveInteger(payload.supplierId, 'supplierId');
  assertPositiveInteger(payload.deliveryWarehouseId, 'deliveryWarehouseId');
  validatePurchaseLines(payload.lines);
}

export function validateUpdatePurchasePayload(payload: UpdatePurchasePayload): void {
  const hasAnyValue =
    payload.supplierId !== undefined ||
    payload.deliveryWarehouseId !== undefined ||
    payload.lines !== undefined;

  if (!hasAnyValue) {
    throw new PurchaseValidationError(
      { field: 'payload', value: payload },
      'Update payload cannot be empty.',
    );
  }

  if (payload.supplierId !== undefined) {
    assertPositiveInteger(payload.supplierId, 'supplierId');
  }

  if (payload.deliveryWarehouseId !== undefined) {
    assertPositiveInteger(payload.deliveryWarehouseId, 'deliveryWarehouseId');
  }

  if (payload.lines !== undefined) {
    validatePurchaseLines(payload.lines);
  }
}

export function validateCancelPurchasePayload(payload: {
  cancelledByUserId: number;
  cancelledByName: string;
}): void {
  assertPositiveInteger(payload.cancelledByUserId, 'cancelledByUserId');
  assertNonEmptyString(payload.cancelledByName, 'cancelledByName');
}

export function validateChangePurchaseStatusPayload(
  payload: ChangePurchaseStatusPayload,
): void {
  if (!PURCHASE_STATUSES.includes(payload.toStatus)) {
    throw new PurchaseValidationError(
      { field: 'toStatus', value: payload.toStatus },
      'toStatus is not a valid purchase status.',
    );
  }

  assertPositiveInteger(payload.changedByUserId, 'changedByUserId');
  assertNonEmptyString(payload.changedByName, 'changedByName');
}

export function validateLineUnitPricesAgainstSupplierCatalog(
  lines: PurchaseLineInput[],
  supplierProducts: PurchaseSupplierProductOption[],
): void {
  const minPriceByProductId = new Map<number, number>();

  for (const supplierProduct of supplierProducts) {
    if (!Number.isFinite(supplierProduct.unitPrice) || supplierProduct.unitPrice < 0) {
      continue;
    }

    if (!minPriceByProductId.has(supplierProduct.productId)) {
      minPriceByProductId.set(supplierProduct.productId, supplierProduct.unitPrice);
      continue;
    }

    const currentMinPrice = minPriceByProductId.get(supplierProduct.productId)!;
    if (supplierProduct.unitPrice < currentMinPrice) {
      minPriceByProductId.set(supplierProduct.productId, supplierProduct.unitPrice);
    }
  }

  lines.forEach((line, index) => {
    const minAllowedPrice = minPriceByProductId.get(line.productId);

    if (minAllowedPrice === undefined) {
      return;
    }

    if (line.unitPrice + Number.EPSILON < minAllowedPrice) {
      throw new PurchaseValidationError(
        {
          field: `lines[${index}].unitPrice`,
          value: line.unitPrice,
          minAllowedPrice,
          productId: line.productId,
        },
        `lines[${index}].unitPrice cannot be lower than supplier purchase price.`,
      );
    }
  });
}

export function normalizePurchaseQueryParams(params: PurchaseQueryParams): PurchaseQueryParams {
  const normalized: PurchaseQueryParams = {
    ...params,
    page: Number.isInteger(params.page) && params.page > 0 ? params.page : 1,
    pageSize:
      Number.isInteger(params.pageSize) && params.pageSize > 0
        ? params.pageSize
        : DEFAULT_PURCHASES_PAGE_SIZE,
  };

  if (params.status !== undefined && !PURCHASE_STATUSES.includes(params.status)) {
    throw new PurchaseValidationError(
      { field: 'status', value: params.status },
      'status is not a valid purchase status.',
    );
  }

  if (params.supplierId !== undefined) {
    assertPositiveInteger(params.supplierId, 'supplierId');
  }

  if (params.sort === undefined) {
    normalized.sort = DEFAULT_PURCHASES_SORT;
  } else if (!PURCHASE_SORT_FIELDS.includes(params.sort.field)) {
    normalized.sort = DEFAULT_PURCHASES_SORT;
  }

  if (normalized.createdFrom !== undefined || normalized.createdTo !== undefined) {
    const fromDate = parseIsoDate(normalized.createdFrom, 'createdFrom');
    const toDate = parseIsoDate(normalized.createdTo, 'createdTo');

    if (fromDate && toDate && fromDate > toDate) {
      throw new PurchaseValidationError(
        {
          field: 'createdFrom/createdTo',
          createdFrom: normalized.createdFrom,
          createdTo: normalized.createdTo,
        },
        'createdFrom cannot be later than createdTo.',
      );
    }
  }

  return normalized;
}
