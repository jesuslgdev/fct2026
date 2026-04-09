export interface ProductDto {
  product_id?: number;
  product_code?: string;
  id?: number;
  code?: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string | null;
  price: string | number;
  vat_rate?: string | number | null;
  stock_current?: number;
  stock_min?: number;
  stock?: number;
  min_stock?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductsPageDto {
  items: ProductDto[];
  data?: ProductDto[];
  total: number;
  page: number;
  page_size: number;
  pageSize?: number;
  total_pages?: number;
}

export interface CreateProductDto {
  product_code?: string;
  code?: string;
  name: string;
  description?: string | null;
  category_id: number;
  price: number | string;
  vat_rate?: number | string;
  stock_current?: number;
  stock_min?: number;
  stock?: number;
  min_stock?: number;
}

export interface UpdateProductDto {
  product_code?: string | null;
  code?: string | null;
  name?: string;
  description?: string | null;
  category_id?: number;
  price?: number | string | null;
  vat_rate?: number | string | null;
  stock_current?: number | null;
  stock_min?: number | null;
  stock?: number | null;
  min_stock?: number | null;
}

export interface ProductCategoryDto {
  category_id?: number;
  id?: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface SetProductActiveDto {
  is_active: boolean;
}
