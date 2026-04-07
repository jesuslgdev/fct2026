import { SaleStatus } from '../enums/sale-status.enum';

export interface Sale {
  id: number;
  saleNumber: string;
  clientId: number;
  clientName: string | null;
  status: SaleStatus;
  saleDate: Date;
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

export interface SaleDetail extends Sale {
  deliveryAddress: string;
  userId: number;
  subtotal: number;
  taxes: number;
  createdAt: Date;
  updatedAt: Date;
  lines: SaleLine[];
}

export interface CreateSaleLine {
  productId: number;
  quantity: number;
}

export interface CreateSale {
  clientId: number;
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
  page: number;
  pageSize: number;
  sortField?: SaleSortField;
  sortOrder?: 'asc' | 'desc';
  status?: SaleStatus;
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
