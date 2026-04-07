import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { HttpSupplierProductRepository } from '@infrastructure/repositories/http/supplier-product.repository.http';
import {
  SupplierProductValidationError,
  SupplierProductNotFoundError,
} from '@domain/models/supplier-product-errors';

describe('HttpSupplierProductRepository', () => {
  let repository: HttpSupplierProductRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpSupplierProductRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(HttpSupplierProductRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists supplier products and maps response', async () => {
    const promise = firstValueFrom(repository.getSupplierProducts(5));

    const req = httpMock.expectOne((request) =>
      request.method === 'GET' && request.url.endsWith('/api/v1/suppliers/5/products'),
    );

    req.flush({
      items: [
        {
          product_id: 7,
          product_name: 'Teclado',
          product_code: 'PRD7',
          category_name: 'Periféricos',
          supplier_price: '19.5',
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    });

    const result = await promise;

    expect(result).toEqual([
      {
        productId: 7,
        productName: 'Teclado',
        productCode: 'PRD7',
        categoryName: 'Periféricos',
        supplierPrice: 19.5,
      },
    ]);
  });

  it('throws validation error before HTTP call when price is invalid', () => {
    expect(() =>
      repository.addProductToSupplier(1, {
        productId: 10,
        supplierPrice: 0,
      }),
    ).toThrow(SupplierProductValidationError);

    httpMock.expectNone(() => true);
  });

  it('maps HTTP 404 into SupplierProductNotFoundError', async () => {
    const promise = firstValueFrom(repository.removeProductFromSupplier(1, 99));

    const req = httpMock.expectOne((request) =>
      request.method === 'DELETE' && request.url.endsWith('/api/v1/suppliers/1/products/99'),
    );

    req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeInstanceOf(SupplierProductNotFoundError);
  });

  it('sends file as multipart in import endpoint', async () => {
    const file = new File(['data'], 'supplier-products.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const promise = firstValueFrom(repository.importSupplierProducts(3, { file }));

    const req = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/v1/suppliers/3/products/import'),
    );

    expect(req.request.body instanceof FormData).toBe(true);
    const sentFile = (req.request.body as FormData).get('file');
    expect(sentFile).toBe(file);

    req.flush({
      total: 5,
      created: 4,
      errors: 1,
      error_detail: [{ row: 4, reason: 'Invalid product code' }],
    });

    const result = await promise;

    expect(result.total).toBe(5);
    expect(result.created).toBe(4);
    expect(result.errors).toBe(1);
    expect(result.error_detail).toEqual([{ row: 4, reason: 'Invalid product code' }]);
  });
});
