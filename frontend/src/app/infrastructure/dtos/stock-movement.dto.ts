export interface StockMovementItemDto {
  movement_id: number;
  product_id: number;
  product_name: string;
  movement_type: 'inbound' | 'outbound' | 'adjustment';
  difference: number;
  reason: string | null;
  purchase_id: number | null;
  sale_id: number | null;
  created_at: string;
}

export interface StockMovementDetailDto extends StockMovementItemDto {
  warehouse_id: number;
  warehouse_name: string;
  previous_quantity: number;
  new_quantity: number;
  user_email: string;
}
