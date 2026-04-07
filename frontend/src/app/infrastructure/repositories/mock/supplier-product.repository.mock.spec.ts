import { describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { MockSupplierProductRepository } from '@infrastructure/repositories/mock/supplier-product.repository.mock';
import {
  SupplierProductDuplicateError,
  SupplierProductNotFoundError,
} from '@domain/models/supplier-product-errors';

describe('MockSupplierProductRepository', () => {
  it('returns products filtered by supplier', async () => {
    const repository = new MockSupplierProductRepository();

    const result = await firstValueFrom(repository.getSupplierProducts(1));

    expect(result.length).toBe(2);
    expect(result.every((item) => item.productId > 0)).toBe(true);
  });

  it('adds a new product for supplier', async () => {
    const repository = new MockSupplierProductRepository();

    const created = await firstValueFrom(
      repository.addProductToSupplier(1, {
        productId: 99,
        supplierPrice: 45.2,
      }),
    );

    const list = await firstValueFrom(repository.getSupplierProducts(1));

    expect(created.productId).toBe(99);
    expect(list.some((item) => item.productId === 99)).toBe(true);
  });

  it('throws duplicate error when product already exists for supplier', () => {
    const repository = new MockSupplierProductRepository();

    expect(() =>
      repository.addProductToSupplier(1, {
        productId: 1,
        supplierPrice: 100,
      }),
    ).toThrow(SupplierProductDuplicateError);
  });

  it('throws not found when updating a non-existing relation', () => {
    const repository = new MockSupplierProductRepository();

    expect(() =>
      repository.updateSupplierProductPrice(7, 999, {
        supplierPrice: 20,
      }),
    ).toThrow(SupplierProductNotFoundError);
  });

  it('returns deterministic import result', async () => {
    const repository = new MockSupplierProductRepository();
    const file = new File(['x'], 'import.xlsx');

    const result = await firstValueFrom(repository.importSupplierProducts(1, { file }));

    expect(result).toEqual({
      total: 2,
      created: 0,
      errors: 0,
      error_detail: [],
    });
  });
});
