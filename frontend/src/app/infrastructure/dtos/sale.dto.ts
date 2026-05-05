import { PaginatedResponse } from '@infrastructure/dtos/paginated-response.dto';

export interface SaleLineDTO {
  sale_line_id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number | string;
  discount: number | string;
  discount_type?: 'percent' | 'amount';
  line_subtotal: number | string;
  vat_rate: number | string;
  line_tax: number | string;
}

export interface SaleDTO {
  sale_id: number;
  sale_number: string;
  client_id: number;
  warehouse_id: number;
  client_name: string | null;
  creator_name: string | null;
  status: string;
  allowed_transitions: string[];
  sale_date: string;
  delivery_address: string;
  created_at: string;
  total: number | string;
}

export interface SaleStatusHistoryDTO {
  from_status: string | null;
  to_status: string;
  changed_at: string;
  changed_by_user_id: number;
}

export interface SaleDetailDTO {
  sale_id: number;
  sale_number: string;
  client_id: number;
  client_name: string | null;
  warehouse_id: number;
  delivery_address: string;
  user_id: number;
  creator_name: string | null;
  sale_date: string;
  status: string;
  allowed_transitions: string[];
  subtotal: number | string;
  taxes: number | string;
  total: number | string;
  created_at: string;
  updated_at: string;
  lines: SaleLineDTO[];
  status_history: SaleStatusHistoryDTO[];
}

export interface CreateSaleLineRequestDTO {
  product_id: number;
  quantity: number;
  discount?: number;
  discount_type?: 'percent' | 'amount';
}

export interface CreateSaleRequestDTO {
  client_id: number;
  warehouse_id: number;
  lines: CreateSaleLineRequestDTO[];
}

export interface UpdateSaleRequestDTO {
  client_id: number;
  delivery_address: string;
  lines: CreateSaleLineRequestDTO[];
}

export interface UpdateSaleLineRequestDTO {
  quantity: number;
  discount?: number;
  discount_type?: 'percent' | 'amount';
}

export interface ChangeSaleStatusRequestDTO {
  new_status: string;
}

export type SalesPageDto = PaginatedResponse<SaleDTO>;
