import { PaginatedResponse } from '@infrastructure/dtos/paginated-response.dto';

export interface StockDistributionItemDto {
  warehouse_id: number;
  warehouse_name: string;
  product_id: number;
  product_code: string;
  product_name: string;
  stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface AdjustStockDto {
  warehouse_id: number;
  product_id: number;
  new_quantity: number;
  reason?: string;
}

export interface AdjustStockResponseDto {
  movement_id: number;
  warehouse_id: number;
  product_id: number;
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  global_stock: number;
  created_at: string;
}

export type StockDistributionPageDto = PaginatedResponse<StockDistributionItemDto>;
