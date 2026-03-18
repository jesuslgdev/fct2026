import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  PagedResult,
} from '@domain/models/product.model';

export abstract class ProductRepository {
  abstract getProducts(params: ProductQueryParams): Promise<PagedResult<Product>>;
  abstract getProductById(productId: number): Promise<Product>;
  abstract createProduct(payload: CreateProductPayload): Promise<Product>;
  abstract updateProduct(productId: number, payload: UpdateProductPayload): Promise<Product>;
  abstract toggleProductStatus(productId: number, isActive: boolean): Promise<void>;
  abstract checkCodeExists(code: string): Promise<boolean>;
  abstract getLowStockProducts(): Promise<Product[]>;
}
