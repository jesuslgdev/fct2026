import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';

export abstract class SupplierProductRepository {
  abstract getSupplierProducts(supplierId: string): Promise<SupplierProduct[]>;
  abstract addProductToSupplier(supplierId: string, request: AddSupplierProductRequest): Promise<SupplierProduct>;
  abstract updateSupplierProductPrice(supplierId: string, productId: string, request: UpdateSupplierProductPriceRequest): Promise<SupplierProduct>;
  abstract removeProductFromSupplier(supplierId: string, productId: string): Promise<void>;
  abstract importSupplierProducts(supplierId: string, request: ImportSupplierProductsRequest): Promise<ImportResult>;
}
