import { SaleStatus } from '../enums/sale-status.enum';

export type { PagedResult } from './paged-result.model';

export interface SaleSummary {
  saleId: number;
  saleNumber: string;
  clientId: number;
  warehouseId: number;
  clientName: string | null;
  creatorName: string | null;
  status: SaleStatus;
  allowedTransitions: SaleStatus[];
  deliveryAddress: string;
  saleDate: Date;
  createdAt: Date;
  total: number;
}

export type Sale = SaleSummary;

export interface SaleLine {
  saleLineId: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineSubtotal: number;
  vatRate: number;
  lineTax: number;
}

export interface SaleStatusHistory {
  fromStatus: SaleStatus | null;
  toStatus: SaleStatus;
  changedAt: Date;
  changedByUserId: number;
}

export interface SaleDetail extends Sale {
  userId: number;
  subtotal: number;
  taxes: number;
  updatedAt: Date;
  lines: SaleLine[];
  statusHistory: SaleStatusHistory[];
}

export interface CreateSaleLine {
  productId: number;
  quantity: number;
  discount?: number;
  discountType?: SaleDiscountType;
}

export type SaleDiscountType = 'percent' | 'amount';

export type CreateSaleLineInput = CreateSaleLine;

export interface CreateSale {
  clientId: number;
  warehouseId: number;
  lines: CreateSaleLineInput[];
}

export interface UpdateSale {
  clientId: number;
  deliveryAddress: string;
  lines: CreateSaleLineInput[];
}

export interface AddSaleLine {
  productId: number;
  quantity: number;
  discount?: number;
  discountType?: SaleDiscountType;
}

export interface UpdateSaleLine {
  quantity: number;
  discount?: number;
  discountType?: SaleDiscountType;
}

export interface AdvanceSaleStatus {
  newStatus: SaleStatus;
}

export type SaleSortField =
  | 'sale_number'
  | 'client_name'
  | 'status'
  | 'sale_date'
  | 'total'
  | 'created_at';

export interface ListSalesFilters {
  page?: number;
  pageSize?: number;
  sortField?: SaleSortField;
  sortOrder?: 'asc' | 'desc';
  status?: SaleStatus;
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
