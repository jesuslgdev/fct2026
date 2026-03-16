import { ProviderStatus } from '@domain/enums/provider-status.enum';

// DTO de lectura (lo que devuelve el API)
export interface ProviderDto {
  provider_id: number;
  name: string;
  tax_id: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  is_active: boolean;
  status: ProviderStatus;
  created_at: string;
  updated_at: string;
}

// DTO de creación (lo que se envía al API para crear)
export interface CreateProviderDto {
  name: string;
  tax_id: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
}

// DTO de actualización
export interface UpdateProviderDto {
  name?: string | null;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  is_active?: boolean | null;
}

// DTOs auxiliares
export interface SetProviderActiveDto {
  is_active: boolean;
}

export interface ProvidersPageDto {
  items: ProviderDto[];
  total: number;
  page: number;
  page_size: number;
}

// DTOs para productos de proveedor
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
