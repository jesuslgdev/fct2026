import { SaleStatus } from '../enums/sale-status.enum';

export type { PagedResult } from './paged-result.model';

export interface Sale {
  id: number;
  saleNumber: string;
  clientId: number;
  warehouseId: number;
  clientName: string | null;
  status: SaleStatus;
  allowedTransitions: SaleStatus[];
  deliveryAddress: string;
  saleDate: Date;
  createdAt: Date;
  total: number;
}

export interface SaleLine {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
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
}

export interface CreateSale {
  clientId: number;
  warehouseId: number;
  lines: CreateSaleLine[];
}

export type SaleSortField =
  | 'sale_number'
  | 'client_name'
  | 'status'
  | 'sale_date'
  | 'total'
  | 'created_at';

export interface SaleFilters {
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
