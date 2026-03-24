import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  PagedResult,
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
}
