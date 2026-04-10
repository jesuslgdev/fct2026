import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { Observable, firstValueFrom, of } from 'rxjs';
import {
  Product,
  ProductCategory,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
  PagedResult,
} from '@domain/models/product.model';
import { ProductRepository } from '@domain/repositories/product.repository';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
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
  code: 'P-001',
  name: 'Leche Entera',
  description: 'Leche entera 1L',
  categoryId: 10,
  categoryName: 'Lacteos',
  price: 1.95,
  stock: 40,
  minStock: 10,
  isActive: true,
};

const PRODUCT_CATEGORY_MOCK: ProductCategory = {
  categoryId: 10,
  name: 'Lacteos',
  description: 'Productos lacteos',
};

class MockProductRepository implements ProductRepository {
  getProducts = vi.fn<(params: ProductQueryParams) => Observable<PagedResult<Product>>>();
  getProductById = vi.fn<(productId: number) => Observable<Product>>();
  createProduct = vi.fn<(payload: CreateProductPayload) => Observable<Product>>();
  updateProduct = vi.fn<(productId: number, payload: UpdateProductPayload) => Observable<Product>>();
  toggleProductStatus = vi.fn<(productId: number, isActive: boolean) => Observable<void>>();
  checkCodeExists = vi.fn<(code: string) => Observable<boolean>>();
  getLowStockProducts = vi.fn<() => Observable<Product[]>>();
}

class MockProductCategoryRepository implements ProductCategoryRepository {
  getCategories = vi.fn<() => Observable<ProductCategory[]>>();
  getCategoryById = vi.fn<(categoryId: number) => Observable<ProductCategory>>();
}

describe('Product Use Cases', () => {
  let productRepo: MockProductRepository;
  let categoryRepo: MockProductCategoryRepository;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    categoryRepo = new MockProductCategoryRepository();

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
        { provide: ProductRepository, useValue: productRepo },
        { provide: ProductCategoryRepository, useValue: categoryRepo },
      ],
    });
  });

  it('GetProductsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductsUseCase);
    const params: ProductQueryParams = { page: 1, pageSize: 20 };
    const resultMock: PagedResult<Product> = {
      data: [PRODUCT_MOCK],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    productRepo.getProducts.mockReturnValueOnce(of(resultMock));

    const result = await firstValueFrom(useCase.execute(params));

    expect(productRepo.getProducts).toHaveBeenCalledWith(params);
    expect(result).toEqual(resultMock);
  });

  it('GetProductByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductByIdUseCase);
    productRepo.getProductById.mockReturnValueOnce(of(PRODUCT_MOCK));

    const result = await firstValueFrom(useCase.execute(1));

    expect(productRepo.getProductById).toHaveBeenCalledWith(1);
    expect(result).toEqual(PRODUCT_MOCK);
  });

  it('CreateProductUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CreateProductUseCase);
    const payload: CreateProductPayload = {
      code: 'P-001',
      name: 'Leche Entera',
      description: 'Leche entera 1L',
      categoryId: 10,
      price: 1.95,
      stock: 40,
      minStock: 10,
    };
    productRepo.createProduct.mockReturnValueOnce(of(PRODUCT_MOCK));

    const result = await firstValueFrom(useCase.execute(payload));

    expect(productRepo.createProduct).toHaveBeenCalledWith(payload);
    expect(result).toEqual(PRODUCT_MOCK);
  });

  it('UpdateProductUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateProductUseCase);
    const payload: UpdateProductPayload = { name: 'Leche Entera ECO' };
    const updatedProduct: Product = { ...PRODUCT_MOCK, name: 'Leche Entera ECO' };
    productRepo.updateProduct.mockReturnValueOnce(of(updatedProduct));

    const result = await firstValueFrom(useCase.execute(1, payload));

    expect(productRepo.updateProduct).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updatedProduct);
  });

  it('ToggleProductStatusUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ToggleProductStatusUseCase);
    productRepo.toggleProductStatus.mockReturnValueOnce(of(void 0));

    await firstValueFrom(useCase.execute(1, false));

    expect(productRepo.toggleProductStatus).toHaveBeenCalledWith(1, false);
    expect(productRepo.toggleProductStatus).toHaveBeenCalledOnce();
  });

  it('CheckProductCodeUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CheckProductCodeUseCase);
    productRepo.checkCodeExists.mockReturnValueOnce(of(true));

    const result = await firstValueFrom(useCase.execute('P-001'));

    expect(productRepo.checkCodeExists).toHaveBeenCalledWith('P-001');
    expect(result).toBe(true);
  });

  it('GetLowStockProductsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetLowStockProductsUseCase);
    productRepo.getLowStockProducts.mockReturnValueOnce(of([PRODUCT_MOCK]));

    const result = await firstValueFrom(useCase.execute());

    expect(productRepo.getLowStockProducts).toHaveBeenCalledOnce();
    expect(result).toEqual([PRODUCT_MOCK]);
  });

  it('GetProductCategoriesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetProductCategoriesUseCase);
    categoryRepo.getCategories.mockReturnValueOnce(of([PRODUCT_CATEGORY_MOCK]));

    const result = await firstValueFrom(useCase.execute());

    expect(categoryRepo.getCategories).toHaveBeenCalledOnce();
    expect(result).toEqual([PRODUCT_CATEGORY_MOCK]);
  });
});