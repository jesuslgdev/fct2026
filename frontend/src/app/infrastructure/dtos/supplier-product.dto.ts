export interface SupplierProductDto {
  product_id: number;
  product_name?: string;
  product_code?: string;
  category_name?: string;
  supplier_price: number;
}

export interface AddSupplierProductDto {
  product_id: number;
  supplier_price: number;
}

export interface UpdateSupplierProductPriceDto {
  supplier_price: number;
}

export interface SupplierProductsPageDto {
  items: SupplierProductDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImportErrorDto {
  row: number;
  reason: string;
}

export interface ImportResultDto {
  total: number;
  created: number;
  errors: number;
  error_detail: ImportErrorDto[];
}
