import { Injectable } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
} from '@domain/models/product.model';

const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    productId: 1,
    code: 'P-0001',
    name: 'Producto ejemplo',
    description: 'Descripción de producto de ejemplo.',
    categoryId: 1,
    categoryName: 'Categoría general',
    price: 12.5,
    stock: 20,
    minStock: 5,
    isActive: true,
    suppliers: [
      {
        supplierId: 1,
        supplierName: 'Proveedor A',
        supplierPrice: 10.5,
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class MockProductRepository implements ProductRepository {
  private products: Product[] = INITIAL_MOCK_PRODUCTS.map((p) => ({ ...p }));
  private nextId = Math.max(...this.products.map((p) => p.productId)) + 1;

  async getProducts(params: { page: number; pageSize: number; search?: string; categoryId?: number; active?: boolean; }): Promise<import("@domain/models/user.model").PagedResult<Product>> {
    const filtered = this.products.filter((p) => {
      if (params.search && !p.name.toLowerCase().includes(params.search.toLowerCase())) {
        return false;
      }
      if (params.categoryId != null && p.categoryId !== params.categoryId) {
        return false;
      }
      if (params.active != null && p.isActive !== params.active) {
        return false;
      }
      return true;
    });

    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getProductById(productId: number): Promise<Product> {
    const product = this.products.find((p) => p.productId === productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return { ...product };
  }

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const exists = this.products.some((p) => p.code === payload.code);
    if (exists) {
      throw new Error('Product code already exists');
    }

    const newProduct: Product = {
      productId: this.nextId++,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      categoryName: 'Categoría general',
      price: payload.price,
      stock: payload.stock,
      minStock: payload.minStock,
      isActive: true,
      suppliers: [],
    };

    this.products.push(newProduct);
    return { ...newProduct };
  }

  async updateProduct(productId: number, payload: UpdateProductPayload): Promise<Product> {
    const index = this.products.findIndex((p) => p.productId === productId);
    if (index === -1) {
      throw new Error('Product not found');
    }

    const existing = this.products[index];
    const updated: Product = {
      ...existing,
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      categoryId: payload.categoryId ?? existing.categoryId,
      price: payload.price ?? existing.price,
      stock: payload.stock ?? existing.stock,
      minStock: payload.minStock ?? existing.minStock,
    };

    this.products[index] = updated;
    return { ...updated };
  }

  async toggleProductStatus(productId: number, isActive: boolean): Promise<void> {
    const product = this.products.find((p) => p.productId === productId);
    if (!product) {
      throw new Error('Product not found');
    }
    product.isActive = isActive;
  }

  async checkCodeExists(code: string): Promise<boolean> {
    return this.products.some((p) => p.code === code);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.products.filter((p) => p.stock < p.minStock).map((p) => ({ ...p }));
  }
}
