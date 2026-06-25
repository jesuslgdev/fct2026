import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  PagedResult,
  ProductSupplier,
  ProductStockByWarehouse,
} from '@domain/models/product.model';
import { Observable } from 'rxjs';

export abstract class ProductRepository {
  abstract getProducts(params: ProductQueryParams): Observable<PagedResult<Product>>;
  abstract getProductById(productId: number): Observable<Product>;
  abstract createProduct(payload: CreateProductPayload): Observable<Product>;
  abstract updateProduct(productId: number, payload: UpdateProductPayload): Observable<Product>;
  abstract toggleProductStatus(productId: number, isActive: boolean): Observable<void>;
  abstract checkCodeExists(code: string): Observable<boolean>;
  abstract getLowStockProducts(): Observable<Product[]>;
  abstract getProductSuppliers(productId: number): Observable<ProductSupplier[]>;
  abstract getProductStockByWarehouses(productId: number): Observable<ProductStockByWarehouse[]>;
}
