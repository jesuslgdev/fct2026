export interface Warehouse {
  warehouseId: number;
  name: string;
  address: string;
  totalStock: number;
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
}

export interface UpdateWarehousePayload {
  name: string;
  address: string;
}

export type WarehouseListResult = Warehouse[];
