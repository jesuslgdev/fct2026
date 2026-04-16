import { SupplierStatus } from '@domain/enums/supplier-status.enum';

export interface SupplierAddressDto {
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

// Read DTO for list responses (returned by the API at /suppliers)
export interface SupplierDto {
  supplier_id?: number;
  provider_id?: number;
  name: string;
  tax_id: string;
  city?: string;
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  address?: SupplierAddressDto | string | null;
  province?: string | null;
  postal_code?: string | null;
  status?: SupplierStatus;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierDetailProductDto {
  id?: number;
  product_id: number;
  product_name?: string;
  provider_id?: number;
  supplier_price: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierDetailDto extends Omit<SupplierDto, 'address'> {
  address: SupplierAddressDto;
  products?: SupplierDetailProductDto[];
}

// Create DTO (payload sent to the API to create a supplier)
export interface CreateSupplierDto {
  name: string;
  tax_id: string;
  address: SupplierAddressDto;
  phone: string;
  email: string;
}

// Update DTO
export interface UpdateSupplierDto {
  name?: string | null;
  address?: SupplierAddressDto | null;
  phone?: string | null;
  email?: string | null;
}

export interface SetSupplierActiveDto {
  is_active: boolean;
}

export interface SuppliersPageDto {
  items: SupplierDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface SupplierProductDto {
  id: number;
  product_id: number;
  product_name: string;
  provider_id: number;
  specific_price: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierProductsDto {
  items: SupplierProductDto[];
}

