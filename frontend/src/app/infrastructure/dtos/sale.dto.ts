export interface SaleLineDTO {
  sale_line_id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_subtotal: number;
  vat_rate: number;
  line_tax: number;
}

export interface SaleDTO {
  sale_id: number;
  sale_number: string;
  client_id: number;
  client_name: string | null;
  status: string;
  sale_date: string;
  total: number | string;
}

export interface SaleDetailDTO {
  sale_id: number;
  sale_number: string;
  client_id: number;
  client_name: string | null;
  delivery_address: string;
  user_id: number;
  sale_date: string;
  status: string;
  subtotal: number | string;
  taxes: number | string;
  total: number | string;
  created_at: string;
  updated_at: string;
  lines: SaleLineDTO[];
}

export interface CreateSaleLineRequestDTO {
  product_id: number;
  quantity: number;
}

export interface CreateSaleRequestDTO {
  client_id: number;
  lines: CreateSaleLineRequestDTO[];
}
