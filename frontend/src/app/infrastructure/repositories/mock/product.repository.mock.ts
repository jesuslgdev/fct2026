import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductCategory,
  ProductQueryParams,
  PagedResult,
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

  getProducts(params: ProductQueryParams): Observable<PagedResult<Product>> {
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

    return of({
      data,
      total: filtered.length,
      page,
      pageSize,
    });
  }

  getProductById(productId: number): Observable<Product> {
    const product = this.products.find((p) => p.productId === productId);
    if (!product) {
      return throwError(() => new Error('Product not found'));
    }
    return of({ ...product });
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    const exists = this.products.some((p) => p.code === payload.code);
    if (exists) {
      return throwError(() => new Error('Product code already exists'));
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
    return of({ ...newProduct });
  }

  updateProduct(productId: number, payload: UpdateProductPayload): Observable<Product> {
    const index = this.products.findIndex((p) => p.productId === productId);
    if (index === -1) {
      return throwError(() => new Error('Product not found'));
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
    return of({ ...updated });
  }

  toggleProductStatus(productId: number, isActive: boolean): Observable<void> {
    const product = this.products.find((p) => p.productId === productId);
    if (!product) {
      return throwError(() => new Error('Product not found'));
    }
    product.isActive = isActive;
    return of(undefined);
  }

  checkCodeExists(code: string): Observable<boolean> {
    return of(this.products.some((p) => p.code === code));
  }

  getLowStockProducts(): Observable<Product[]> {
    return of(this.products.filter((p) => p.stock < p.minStock).map((p) => ({ ...p })));
  }

  getProductCategories(): Observable<ProductCategory[]> {
    const mockCategories: ProductCategory[] = [
      {
        categoryId: 1,
        name: 'Categoría general',
        description: 'Categoría de productos generales',
      },
      {
        categoryId: 2,
        name: 'Electrónica',
        description: 'Productos electrónicos',
      },
    ];
    return of(mockCategories);
  }
}
