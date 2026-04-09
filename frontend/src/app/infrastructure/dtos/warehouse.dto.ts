export interface WarehouseDto {
  warehouse_id: number;
  name: string;
  address: string;
  total_stock: number;
}

export interface CreateWarehouseDto {
  name: string;
  address: string;
}

export interface UpdateWarehouseDto {
  name: string;
  address: string;
}
