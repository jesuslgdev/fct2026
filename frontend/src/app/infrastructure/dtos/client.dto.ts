export interface ClientDto {
  client_id: number;
  name: string;
  tax_id: string;
  city: string;
  is_active: boolean;
}

export interface CreateClientDto {
  name: string;
  tax_id: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
}

export interface UpdateClientDto {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface SetClientActiveDto {
  is_active: boolean;
}

export interface ClientsPageDto {
  items: ClientDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface ClientDetailDto {
  client_id: number;
  name: string;
  tax_id: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  is_active: boolean;
}
