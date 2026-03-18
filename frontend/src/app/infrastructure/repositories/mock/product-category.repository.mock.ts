import { Injectable } from '@angular/core';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
import { ProductCategory } from '@domain/models/product.model';

const INITIAL_MOCK_CATEGORIES: ProductCategory[] = [
  {
    categoryId: 1,
    name: 'Categoría general',
    description: 'Categoría por defecto para productos de ejemplo.',
  },
  {
    categoryId: 2,
    name: 'Categoría adicional',
    description: 'Segunda categoría para pruebas.',
  },
];

@Injectable({ providedIn: 'root' })
export class MockProductCategoryRepository implements ProductCategoryRepository {
  async getCategories(): Promise<ProductCategory[]> {
    return INITIAL_MOCK_CATEGORIES.map((c) => ({ ...c }));
  }

  async getCategoryById(categoryId: number): Promise<ProductCategory> {
    const category = INITIAL_MOCK_CATEGORIES.find((c) => c.categoryId === categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    return { ...category };
  }
}
