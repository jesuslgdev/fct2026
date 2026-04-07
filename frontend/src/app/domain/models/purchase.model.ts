import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { PagedResult } from '@domain/models/user.model';

export type { PagedResult };

export type SortDirection = 'asc' | 'desc';

export type PurchaseSortField =
  | 'purchaseNumber'
  | 'supplierName'
  | 'status'
  | 'deliveryAddress'
  | 'createdAt'
  | 'total';

export interface PurchaseSort {
  field: PurchaseSortField;
  direction: SortDirection;
}

export const DEFAULT_PURCHASES_PAGE_SIZE = 20;

export const DEFAULT_PURCHASES_SORT: PurchaseSort = {
  field: 'createdAt',
  direction: 'desc',
};

export type PurchaseStatusTransitionEffect =
  | 'none'
  | 'freeze_lines'
  | 'final_state'
  | 'generate_stock_entry';

export interface PurchaseLineInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface PurchaseLineTotals {
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface PurchaseLine extends PurchaseLineInput, PurchaseLineTotals {
  lineId: number;
  productName: string;
}

export interface PurchaseTotals {
  subtotal: number;
  vatTotal: number;
  total: number;
}

export interface PurchaseStatusAuditEntry {
  fromStatus: PurchaseStatus | null;
  toStatus: PurchaseStatus;
  changedAt: string;
  changedByUserId: number;
  changedByName: string;
  effect: PurchaseStatusTransitionEffect;
}

export interface PurchaseSummary {
  purchaseId: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  deliveryWarehouseId: number;
  deliveryAddress: string;
  status: PurchaseStatus;
  createdAt: string;
  total: number;
}

export interface PurchaseDetail extends PurchaseSummary, PurchaseTotals {
  lines: PurchaseLine[];
  createdByUserId: number;
  createdByName: string;
  updatedAt: string | null;
  cancelledAt: string | null;
  cancelledByUserId: number | null;
  cancelledByName: string | null;
  statusHistory: PurchaseStatusAuditEntry[];
}

export interface PurchaseSupplierOption {
  supplierId: number;
  supplierName: string;
  isActive: boolean;
}

export interface PurchaseWarehouseOption {
  warehouseId: number;
  warehouseName: string;
  address: string;
}

export interface PurchaseSupplierProductOption {
  productId: number;
  productName: string;
  supplierId: number;
  unitPrice: number;
  vatRate: number;
}

export interface PurchaseQueryParams {
  page: number;
  pageSize: number;
  status?: PurchaseStatus;
  supplierId?: number;
  supplierSearch?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: PurchaseSort;
}

export interface CreatePurchasePayload {
  supplierId: number;
  deliveryWarehouseId: number;
  lines: PurchaseLineInput[];
}

export interface UpdatePurchasePayload {
  supplierId?: number;
  deliveryWarehouseId?: number;
  lines?: PurchaseLineInput[];
}

export interface CancelPurchasePayload {
  cancelledByUserId: number;
  cancelledByName: string;
  cancelledAt?: string;
  reason?: string | null;
}

export interface ChangePurchaseStatusPayload {
  toStatus: PurchaseStatus;
  changedByUserId: number;
  changedByName: string;
  changedAt?: string;
}

export interface PurchasePermissionContext {
  role: UserRole | null | undefined;
  departmentId: number | null | undefined;
  purchasesDepartmentId: number;
}
