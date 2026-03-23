export interface SupplierProduct {
  supplierId: number;
  productId: number;
  productCode: string;
  productName: string;
  categoryName?: string;
  supplierPrice: number;
  createdAt: string;
  updatedAt: string;
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
  products: {
    productCode: string;
    supplierPrice: number;
  }[];
}

// Response DTOs
export interface ImportResult {
  total: number;
  created: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  reason: string;
}
