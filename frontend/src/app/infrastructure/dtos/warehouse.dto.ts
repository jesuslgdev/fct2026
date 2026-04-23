export interface WarehouseAddressDto {
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface WarehouseDto {
  warehouse_id: number;
  name: string;
  address: WarehouseAddressDto;
  total_stock: number;
}

export interface CreateWarehouseDto {
  name: string;
  address: WarehouseAddressDto;
}

export interface UpdateWarehouseDto {
  name: string;
  address: WarehouseAddressDto;
}
