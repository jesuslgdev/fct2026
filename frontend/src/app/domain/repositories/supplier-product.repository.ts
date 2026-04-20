import { Observable } from 'rxjs';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  DownloadSupplierProductTemplateRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
  ProductSupplier,
  PagedResult,
  SupplierProductQueryParams,
  ProductSupplierQueryParams,
} from '@domain/models/supplier-product.model';

export abstract class SupplierProductRepository {
  abstract getSupplierProducts(supplierId: number, params?: SupplierProductQueryParams): Observable<PagedResult<SupplierProduct>>;
  abstract addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Observable<SupplierProduct>;
  abstract updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Observable<SupplierProduct>;
  abstract removeProductFromSupplier(supplierId: number, productId: number): Observable<void>;
  abstract importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Observable<ImportResult>;
  abstract downloadTemplate(supplierId: number, request?: DownloadSupplierProductTemplateRequest): Observable<Blob>;
  abstract getProductSuppliers(productId: number, params?: ProductSupplierQueryParams): Observable<PagedResult<ProductSupplier>>;
}
