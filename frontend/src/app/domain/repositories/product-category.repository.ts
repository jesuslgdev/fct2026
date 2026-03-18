import { ProductCategory } from '@domain/models/product.model';

export abstract class ProductCategoryRepository {
  abstract getCategories(): Promise<ProductCategory[]>;
  abstract getCategoryById(categoryId: number): Promise<ProductCategory>;
}
