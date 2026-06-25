import { PagedResult } from './paged-result.model';

export type MovementType = 'inbound' | 'outbound' | 'adjustment';

export interface StockMovement {
  movementId: number;
  productName: string;
  movementType: MovementType;
  difference: number;
  reason: string | null;
  purchaseId: number | null;
  saleId: number | null;
  createdAt: Date;
}

export interface StockMovementDetail extends StockMovement {
  warehouseId: number;
  warehouseName: string;
  productId: number;
  previousQuantity: number;
  newQuantity: number;
  userEmail: string;
}

export interface ListStockMovementsPayload {
  productId?: number;
  movementType?: MovementType;
  dateFrom?: Date;
  dateTo?: Date;
  reasonSearch?: string;
}

export type StockMovementPagedResult = PagedResult<StockMovement>;
