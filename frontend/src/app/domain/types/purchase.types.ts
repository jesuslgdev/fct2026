import { PurchaseStatus } from '@domain/enums/purchase-status.domain.enum';

export type SortDirection = 'asc' | 'desc';

export type PurchaseSortField =
  | 'purchaseNumber'
  | 'supplierName'
  | 'status'
  | 'deliveryAddress'
  | 'createdAt'
  | 'total';

export type DiscountType = 'percentage' | 'fixed';

/**
 * Linea de entrada para crear o editar una compra.
 */
export interface PurchaseLineInput {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
}

/**
 * Linea de compra con importes calculados por reglas de dominio.
 */
export interface PurchaseLine extends PurchaseLineInput {
  discountAmount: number;
  lineSubtotal: number;
}

export interface Supplier {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  deliveryAddress: string;
}

export interface Product {
  id: number;
  name: string;
  supplierId: number;
  unitPrice: number;
  isActive: boolean;
}

/**
 * Entidad raiz de compra en dominio.
 */
export interface PurchaseOrder {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseStatus;
  deliveryWarehouseId: number;
  deliveryAddress: string;
  createdAt: string;
  createdByUserId: number;
  createdByUserName: string;
  lines: readonly PurchaseLine[];
  subtotalWithoutVat: number;
  vatTotal: number;
  totalWithVat: number;
}

/**
 * Filtros combinables para listado de compras.
 * page, pageSize y ordenacion se incluyen para persistencia en URL.
 */
export interface PurchaseFilters {
  status?: PurchaseStatus;
  supplierId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
  sortBy: PurchaseSortField;
  sortDirection: SortDirection;
}

/**
 * Respuesta paginada generica desacoplada de infraestructura.
 */
export interface PaginatedResponse<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PurchaseSummaryTotals {
  subtotalGeneral: number;
  ivaTotal: number;
  totalFinal: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  deliveryWarehouseId: number;
  lines: readonly PurchaseLineInput[];
}

export interface UpdatePurchaseOrderInput {
  supplierId?: number;
  deliveryWarehouseId?: number;
  lines?: readonly PurchaseLineInput[];
}
