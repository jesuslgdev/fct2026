export interface SupplierProduct {
  productId: number;
  productCode?: string | null;
  productName?: string | null;
  categoryName?: string | null;
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

// Response DTOs
export interface ImportResult {
  total: number;
  created: number;
  errors: number;
  error_detail: ImportError[];
}

export interface ImportError {
  row: number;
  reason: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
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
