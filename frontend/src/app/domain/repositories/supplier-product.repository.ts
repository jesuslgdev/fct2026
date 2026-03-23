import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';

export abstract class SupplierProductRepository {
  abstract getSupplierProducts(supplierId: number): Promise<SupplierProduct[]>;
  abstract addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Promise<SupplierProduct>;
  abstract updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Promise<SupplierProduct>;
  abstract removeProductFromSupplier(supplierId: number, productId: number): Promise<void>;
  abstract importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Promise<ImportResult>;
}
