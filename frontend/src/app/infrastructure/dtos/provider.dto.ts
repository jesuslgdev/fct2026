import { ProviderStatus } from '@domain/enums/provider-status.enum';

// Read DTO for list responses (returned by the API at /providers)
export interface ProviderDto {
  supplier_id?: number;
  provider_id?: number;
  name: string;
  tax_id: string;
  city?: string;
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  postal_code?: string | null;
  status?: ProviderStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderDetailDto extends ProviderDto {
  products?: SupplierProductDto[];
}

// Create DTO (payload sent to the API to create a provider)
export interface CreateProviderDto {
  name: string;
  tax_id: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
}

// Update DTO
export interface UpdateProviderDto {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface SetSupplierActiveDto {
  is_active: boolean;
}

export type UpdateSupplierDto = UpdateProviderDto;

export interface ProvidersPageDto {
  items: ProviderDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface SupplierProductDto {
  id?: number;
  product_id: number;
  product_name?: string;
  provider_id?: number;
  supplier_price: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderProductDto {
  id: number;
  product_id: number;
  product_name: string;
  provider_id: number;
  specific_price: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderProductsDto {
  items: ProviderProductDto[];
}
