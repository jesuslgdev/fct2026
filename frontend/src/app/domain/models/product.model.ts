export type { PagedResult } from '@domain/models/paged-result.model';

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
  vatRate: number;
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
  minStock: number;
}

export interface UpdateProductPayload {
  name?: string | null;
  description?: string | null;
  categoryId?: number | null;
  price?: number | null;
  minStock?: number | null;
}

export interface ProductQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: number;
  active?: boolean;
}

export interface ProductStockByWarehouse {
  warehouseId: number;
  warehouseName: string;
  warehouseLocation?: string;
  currentStock: number;
  minStock: number;
  status: 'critical' | 'low' | 'normal' | 'out';
}

export interface ProductStockView {
  productId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  price: number;
  totalStock: number;
  minStock: number;
  stockStatus: 'critical' | 'low' | 'normal' | 'out';
  warehouses: ProductStockByWarehouse[];
  isActive: boolean;
}

