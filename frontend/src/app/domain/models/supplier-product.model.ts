export interface SupplierProduct {
  supplierId: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName?: string;
  supplierPrice: number;
  createdAt: string;
  updatedAt: string;
}


export interface AddSupplierProductRequest {
  productId: string;
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
