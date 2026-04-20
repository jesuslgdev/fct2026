export type { PagedResult } from '@domain/models/paged-result.model';

export interface SupplierProduct {
  productId: number;
  productCode?: string;
  productName?: string;
  categoryName?: string;
  supplierPrice: number;
}

// Request DTOs (I - Interface Segregation)
export interface AddSupplierProductRequest {
  productId: number;
  supplierPrice: number;
}

export interface UpdateSupplierProductPriceRequest {
  supplierPrice: number;
}

export interface ImportSupplierProductsRequest {
  file: File;
}

export interface DownloadSupplierProductTemplateRequest {
  productIds?: number[];
}

// Response DTOs
export interface ImportResult {
  total: number;
  created: number;
  errors: number;
  errorDetail: ImportError[];
}

export interface ImportError {
  row: number;
  reason: string;
}

export interface SupplierProductQueryParams {
  page: number;
  pageSize: number;
}


export interface ProductSupplierQueryParams {
  page: number;
  pageSize: number;
}


export interface ProductSupplier {
  supplierId: number;
  supplierName: string;
  taxId: string;
  supplierPrice: number;
}
