import { PagedResult } from '@domain/models/user.model';

export type { PagedResult };

export interface ProductCategory {
  categoryId: number;
  name: string;
  description: string;
}

export interface ProductSupplier {
  supplierId: number;
  supplierName: string;
  supplierPrice: number;
}

export interface Product {
  productId: number;
  code: string;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  price: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  suppliers?: ProductSupplier[];
}

export interface CreateProductPayload {
  code: string;
  name: string;
  description: string;
  categoryId: number;
  price: number;
  stock: number;
  minStock: number;
}

export interface UpdateProductPayload {
  name?: string | null;
  description?: string | null;
  categoryId?: number | null;
  price?: number | null;
  stock?: number | null;
  minStock?: number | null;
}

export interface ProductQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: number;
  active?: boolean;
}

