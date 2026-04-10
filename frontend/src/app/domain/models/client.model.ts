
export interface Client {
  clientId: number;
  name: string;
  taxId: string;
  city: string;
  isActive: boolean;
}

export interface ClientDetail extends Client {
  address: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface CreateClientPayload {
  name: string;
  taxId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface UpdateClientPayload {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ClientQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export type { PagedResult } from '@domain/models/paged-result.model';
