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
  contact_person?: string | null;
  status?: ProviderStatus;
  created_at?: string;
  updated_at?: string;
}

// Create DTO (payload sent to the API to create a provider)
export interface CreateProviderDto {
  name: string;
  tax_id: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
}

// Update DTO
export interface UpdateProviderDto {
  name?: string | null;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  is_active?: boolean | null;
}

// Helper DTOs
export interface SetProviderActiveDto {
  is_active: boolean;
}

export interface ProvidersPageDto {
  items: ProviderDto[];
  total: number;
  page: number;
  page_size: number;
}

// DTOs for provider products
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
