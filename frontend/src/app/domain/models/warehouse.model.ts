export interface WarehouseAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface Warehouse {
  warehouseId: number;
  name: string;
  address: string;
  addressData: WarehouseAddress;
  totalStock: number;
}

export interface CreateWarehousePayload {
  name: string;
  address: WarehouseAddress;
}

export interface UpdateWarehousePayload {
  name: string;
  address: WarehouseAddress;
}

export type WarehouseListResult = Warehouse[];
