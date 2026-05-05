import { PaginatedResponse } from '@infrastructure/dtos/paginated-response.dto';

export type BackendPurchaseStatus =
  | 'Pending'
  | 'Approved'
  | 'In Process'
  | 'InProcess'
  | 'Shipped'
  | 'Sent'
  | 'Received'
  | 'Cancelled';

export interface PurchaseListItemDto {
  purchase_id: number;
  purchase_number: string;
  supplier_name: string | null;
  status: BackendPurchaseStatus | string;
  allowed_transitions?: string[];
  warehouse_id: number;
  created_at: string;
  total: number | string | null;
}

export type PurchasesPageDto = PaginatedResponse<PurchaseListItemDto>;

export interface PurchaseLineDto {
  purchase_line_id: number;
  purchase_id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number | string;
  discount: number | string;
  line_subtotal: number | string;
  vat_rate: number | string;
  line_tax: number | string;
}

export interface PurchaseStatusHistoryDto {
  from_status: BackendPurchaseStatus | string | null;
  to_status: BackendPurchaseStatus | string;
  changed_at: string;
  changed_by_user_id: number;
}

export interface PurchaseDetailDto {
  purchase_id: number;
  purchase_number: string;
  supplier_id: number;
  supplier_name: string | null;
  user_id: number;
  user_name: string | null;
  warehouse_id: number;
  warehouse_name: string | null;
  purchase_date: string;
  status: BackendPurchaseStatus | string;
  subtotal: number | string;
  taxes: number | string;
  total: number | string;
  cancelled_at: string | null;
  cancelled_by_user_id: number | null;
  allowed_transitions?: string[];
  created_at: string;
  updated_at: string | null;
  lines: PurchaseLineDto[];
  status_history?: PurchaseStatusHistoryDto[];
}

export interface CreatePurchaseLineRequestDto {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface CreatePurchaseRequestDto {
  supplier_id: number;
  warehouse_id: number;
  lines: CreatePurchaseLineRequestDto[];
}

export interface UpdatePurchaseRequestDto {
  supplier_id: number;
  warehouse_id: number;
}

export interface AddPurchaseLineRequestDto {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface UpdatePurchaseLineRequestDto {
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface AdvancePurchaseStatusRequestDto {
  status: 'Approved' | 'InProcess' | 'In Process' | 'Sent' | 'Received';
}

export interface SupplierDto {
  supplier_id: number;
  name: string;
  tax_id: string;
  city: string;
  is_active: boolean;
}

export type SuppliersPageDto = PaginatedResponse<SupplierDto>;

export interface SupplierProductDto {
  product_id: number;
  product_name: string | null;
  product_code: string | null;
  category_name: string | null;
  supplier_price: number | string;
}

export type SupplierProductsPageDto = PaginatedResponse<SupplierProductDto>;

export interface CatalogProductDto {
  product_id: number;
  product_code: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string | null;
  price: number | string;
  vat_rate: number | string;
  stock_current: number;
  stock_min: number;
  is_active: boolean;
}
