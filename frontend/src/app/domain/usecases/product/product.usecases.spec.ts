import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProductRepository } from '@domain/repositories/product.repository';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
import {
  Product,
  ProductCategory,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
} from '@domain/models/product.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { GetProductByIdUseCase } from '@domain/usecases/product/get-product-by-id.usecase';
import { CreateProductUseCase } from '@domain/usecases/product/create-product.usecase';
import { UpdateProductUseCase } from '@domain/usecases/product/update-product.usecase';
import { ToggleProductStatusUseCase } from '@domain/usecases/product/toggle-product-status.usecase';
import { CheckProductCodeUseCase } from '@domain/usecases/product/check-product-code.usecase';
import { GetLowStockProductsUseCase } from '@domain/usecases/product/get-low-stock-products.usecase';
import { GetProductCategoriesUseCase } from '@domain/usecases/product/get-product-categories.usecase';

const PRODUCT_MOCK: Product = {
  productId: 1,
  code: 'P-0001',
  name: 'Producto ejemplo',
  description: 'Descripción ejemplo',
  categoryId: 1,
  categoryName: 'Categoría general',
  price: 10,
  stock: 5,
  minStock: 2,
  isActive: true,
  suppliers: [],
};

const CATEGORY_MOCK: ProductCategory = {
  categoryId: 1,
  name: 'Categoría general',
  description: 'Categoría de ejemplo',
};

class MockProductRepository implements ProductRepository {
  getProducts = vi.fn<(params: ProductQueryParams) => Promise<import('@domain/models/user.model').PagedResult<Product>>>();
  getProductById = vi.fn<(id: number) => Promise<Product>>();
  createProduct = vi.fn<(payload: CreateProductPayload) => Promise<Product>>();
  updateProduct = vi.fn<(id: number, payload: UpdateProductPayload) => Promise<Product>>();
  toggleProductStatus = vi.fn<(id: number, active: boolean) => Promise<void>>();
  checkCodeExists = vi.fn<(code: string) => Promise<boolean>>();
  getLowStockProducts = vi.fn<() => Promise<Product[]>>();
}

class MockProductCategoryRepository implements ProductCategoryRepository {
  getCategories = vi.fn<() => Promise<ProductCategory[]>>();
  getCategoryById = vi.fn<(categoryId: number) => Promise<ProductCategory>>();
}

describe('Product Use Cases', () => {
  let repo: MockProductRepository;
  let categoryRepo: MockProductCategoryRepository;

  beforeEach(() => {
    repo = new MockProductRepository();
    categoryRepo = new MockProductCategoryRepository();
    categoryRepo.getCategories.mockResolvedValue([CATEGORY_MOCK]);

    TestBed.configureTestingModule({
      providers: [
        GetProductsUseCase,
        GetProductByIdUseCase,
        CreateProductUseCase,
        UpdateProductUseCase,
        ToggleProductStatusUseCase,
        CheckProductCodeUseCase,
        GetLowStockProductsUseCase,
        GetProductCategoriesUseCase,
        { provide: ProductRepository, useValue: repo },
        { provide: ProductCategoryRepository, useValue: categoryRepo },
      ],
    });
  });

  it('GetProductsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductsUseCase);
    const params: ProductQueryParams = { page: 1, pageSize: 20 };
    const resultMock = { data: [PRODUCT_MOCK], total: 1, page: 1, pageSize: 20 };
    repo.getProducts.mockResolvedValueOnce(resultMock);

    const result = await useCase.execute(params);

    expect(repo.getProducts).toHaveBeenCalledOnce();
    expect(repo.getProducts).toHaveBeenCalledWith(params);
    expect(result).toEqual(resultMock);
  });

  it('GetProductByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductByIdUseCase);
    repo.getProductById.mockResolvedValueOnce(PRODUCT_MOCK);

    const result = await useCase.execute(1);

    expect(repo.getProductById).toHaveBeenCalledWith(1);
    expect(result).toEqual(PRODUCT_MOCK);
  });

  it('CreateProductUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CreateProductUseCase);
    const payload: CreateProductPayload = {
      code: 'P-0001',
      name: 'Producto ejemplo',
      description: 'Descripción ejemplo',
      categoryId: 1,
      price: 10,
      stock: 5,
      minStock: 2,
    };
    repo.createProduct.mockResolvedValueOnce(PRODUCT_MOCK);

    const result = await useCase.execute(payload);

    expect(repo.createProduct).toHaveBeenCalledWith(payload);
    expect(result).toEqual(PRODUCT_MOCK);
  });

  it('UpdateProductUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateProductUseCase);
    const payload: UpdateProductPayload = { name: 'Nuevo nombre' };
    const updated = { ...PRODUCT_MOCK, name: 'Nuevo nombre' };
    repo.updateProduct.mockResolvedValueOnce(updated);

    const result = await useCase.execute(1, payload);

    expect(repo.updateProduct).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('ToggleProductStatusUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ToggleProductStatusUseCase);
    repo.toggleProductStatus.mockResolvedValueOnce();

    await useCase.execute(1, false);

    expect(repo.toggleProductStatus).toHaveBeenCalledWith(1, false);
    expect(repo.toggleProductStatus).toHaveBeenCalledOnce();
  });

  it('CheckProductCodeUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CheckProductCodeUseCase);
    repo.checkCodeExists.mockResolvedValueOnce(true);

    const result = await useCase.execute('P-0001');

    expect(repo.checkCodeExists).toHaveBeenCalledWith('P-0001');
    expect(result).toEqual(true);
  });

  it('GetLowStockProductsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetLowStockProductsUseCase);
    repo.getLowStockProducts.mockResolvedValueOnce([PRODUCT_MOCK]);

    const result = await useCase.execute();

    expect(repo.getLowStockProducts).toHaveBeenCalledOnce();
    expect(result).toEqual([PRODUCT_MOCK]);
  });

  it('GetProductCategoriesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductCategoriesUseCase);

    const result = await useCase.execute();

    expect(categoryRepo.getCategories).toHaveBeenCalledOnce();
    expect(result).toEqual([CATEGORY_MOCK]);
  });
});
