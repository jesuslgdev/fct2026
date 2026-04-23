type ApiDecimal = number | string;

export interface SupplierProductDto {
  product_id: number;
  product_name?: string | null;
  product_code?: string | null;
  category_name?: string | null;
  supplier_price: ApiDecimal;
}

export interface AddSupplierProductDto {
  product_id: number;
  supplier_price: ApiDecimal;
}

export interface UpdateSupplierProductPriceDto {
  supplier_price: ApiDecimal;
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

export interface ProductSupplierDto {
  supplier_id: number;
  supplier_name: string;
  tax_id: string;
  supplier_price: ApiDecimal;
}

export interface ProductSuppliersPageDto {
  items: ProductSupplierDto[];
  total: number;
  page: number;
  page_size: number;
}
