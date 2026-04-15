export interface ClientDto {
  client_id: number;
  name: string;
  tax_id: string;
  city: string;
  is_active: boolean;
}

export interface ClientAddressDto {
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface CreateClientDto {
  name: string;
  tax_id: string;
  address: ClientAddressDto;
  phone: string;
  email: string;
}

export interface UpdateClientDto {
  name?: string | null;
  address?: ClientAddressDto | null;
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
  address: ClientAddressDto;
  phone: string;
  email: string;
  is_active: boolean;
  // TODO: add created_at/updated_at when API exposes them
}
