export interface ProductDto {
  id: number;
  code: string;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductsPageDto {
  items: ProductDto[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateProductDto {
  code: string;
  name: string;
  description: string;
  category_id: number;
  price: number;
  stock: number;
  min_stock: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  category_id?: number;
  price?: number;
  stock?: number;
  min_stock?: number;
}

export interface ProductCategoryDto {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}
