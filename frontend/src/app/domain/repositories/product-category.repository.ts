import { ProductCategory } from '@domain/models/product.model';
import { Observable } from 'rxjs';

export abstract class ProductCategoryRepository {
  abstract getCategories(): Observable<ProductCategory[]>;
  abstract getCategoryById(categoryId: number): Observable<ProductCategory>;
}
