import type { PagedResult } from '@domain/models/paged-result.model';

export interface StockDistributionItem {
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productCode: string;
  productName: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
}

export interface AdjustStockPayload {
  warehouseId: number;
  productId: number;
  newQuantity: number;
  reason?: string;
}

export interface AdjustStockResult {
  movementId: number;
  warehouseId: number;
  productId: number;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  globalStock: number;
  createdAt: string;
}

export interface StockDistributionFilters {
  page?: number;
  pageSize?: number;
  warehouseId?: number;
  productId?: number;
  productName?: string;
}

export type StockDistributionListResult = PagedResult<StockDistributionItem>;
