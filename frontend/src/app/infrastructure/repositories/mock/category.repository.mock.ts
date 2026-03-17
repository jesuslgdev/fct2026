import { Injectable } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import {
  Category,
  CategoryListResult,
} from '@domain/models/category.model';

const INITIAL_MOCK_CATEGORIES: Category[] = [
  {
    categoryId: 1,
    name: 'Electronics',
    description: 'Electronic devices and accessories',
  },
  {
    categoryId: 2,
    name: 'Clothing',
    description: 'Apparel and fashion items',
  },
  {
    categoryId: 3,
    name: 'Books',
    description: 'Books and educational materials',
  },
  {
    categoryId: 4,
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
  },
  {
    categoryId: 5,
    name: 'Sports',
    description: 'Sports equipment and accessories',
  },
];

@Injectable()
export class MockCategoryRepository implements CategoryRepository {
  private categories: Category[];

  constructor() {
    this.categories = INITIAL_MOCK_CATEGORIES.map((c) => ({ ...c }));
  }

  async getCategories(): Promise<CategoryListResult> {
    return [...this.categories];
  }

  async getCategoryById(categoryId: number): Promise<Category> {
    const category = this.categories.find((c) => c.categoryId === categoryId);
    if (!category) throw new Error(`Category with ID ${categoryId} not found.`);
    return { ...category };
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const category = this.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    return category ? { ...category } : null;
  }

  async createCategory(name: string, description: string): Promise<Category> {
    // Check if category with same name already exists
    const existing = this.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) throw new Error(`Category with name "${name}" already exists.`);

    const nextId = Math.max(0, ...this.categories.map((c) => c.categoryId)) + 1;
    const newCategory: Category = {
      categoryId: nextId,
      name: name.trim(),
      description: description.trim(),
    };
    this.categories = [...this.categories, newCategory];
    return { ...newCategory };
  }

  async updateCategory(
    categoryId: number,
    name: string | null,
    description: string | null
  ): Promise<Category> {
    const index = this.categories.findIndex((c) => c.categoryId === categoryId);
    if (index === -1) throw new Error(`Category with ID ${categoryId} not found.`);

    // Check if new name conflicts with existing category
    if (name && name !== this.categories[index].name) {
      const existing = this.categories.find(
        (c) => c.categoryId !== categoryId && c.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) throw new Error(`Category with name "${name}" already exists.`);
    }

    const updated: Category = {
      ...this.categories[index],
      ...(name !== null && { name: name.trim() }),
      ...(description !== null && { description: description.trim() }),
    };

    this.categories = this.categories.map((c) => (c.categoryId === categoryId ? updated : c));
    return { ...updated };
  }

  async deleteCategory(categoryId: number): Promise<void> {
    const index = this.categories.findIndex((c) => c.categoryId === categoryId);
    if (index === -1) throw new Error(`Category with ID ${categoryId} not found.`);

    // Simulate check for associated products (random for demo)
    const hasProducts = Math.random() > 0.7; // 30% chance of having products
    if (hasProducts) {
      throw new Error('Cannot delete category with associated products.');
    }

    this.categories = this.categories.filter((c) => c.categoryId !== categoryId);
  }

  async categoryHasProducts(categoryId: number): Promise<boolean> {
    const category = this.categories.find((c) => c.categoryId === categoryId);
    if (!category) throw new Error(`Category with ID ${categoryId} not found.`);

    // Simulate check for associated products (random for demo)
    return Math.random() > 0.7; // 30% chance of having products
  }
}
