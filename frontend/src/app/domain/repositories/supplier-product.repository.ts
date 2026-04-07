import { Observable } from 'rxjs';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';

export abstract class SupplierProductRepository {
  abstract getSupplierProducts(supplierId: number): Observable<SupplierProduct[]>;
  abstract addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Observable<SupplierProduct>;
  abstract updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Observable<SupplierProduct>;
  abstract removeProductFromSupplier(supplierId: number, productId: number): Observable<void>;
  abstract importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Observable<ImportResult>;
}
