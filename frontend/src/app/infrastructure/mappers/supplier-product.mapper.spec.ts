import { describe, expect, it } from 'vitest';
import { SupplierProductMapper } from '@infrastructure/mappers/supplier-product.mapper';
import {
  SupplierProductDto,
  SupplierProductsPageDto,
  ImportResultDto,
} from '@infrastructure/dtos/supplier-product.dto';

describe('SupplierProductMapper', () => {
  it('maps DTO to domain model and parses decimal strings', () => {
    const dto: SupplierProductDto = {
      product_id: 10,
      product_code: 'PRD10',
      product_name: 'Cable HDMI',
      category_name: 'Accesorios',
      supplier_price: '15.75',
    };

    const result = SupplierProductMapper.fromDto(dto);

    expect(result).toEqual({
      productId: 10,
      productCode: 'PRD10',
      productName: 'Cable HDMI',
      categoryName: 'Accesorios',
      supplierPrice: 15.75,
    });
  });

  it('maps page DTO to list of domain models', () => {
    const dto: SupplierProductsPageDto = {
      items: [
        {
          product_id: 1,
          product_code: 'P1',
          product_name: 'Producto 1',
          category_name: null as unknown as string,
          supplier_price: 9.99,
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    };

    const result = SupplierProductMapper.fromPageDto(dto);

    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe(1);
    expect(result[0]?.supplierPrice).toBe(9.99);
  });

  it('maps import result DTO to domain shape', () => {
    const dto: ImportResultDto = {
      total: 3,
      created: 2,
      errors: 1,
      error_detail: [{ row: 2, reason: 'Invalid price' }],
    };

    const result = SupplierProductMapper.importResultFromDto(dto);

    expect(result).toEqual({
      total: 3,
      created: 2,
      errors: 1,
      error_detail: [{ row: 2, reason: 'Invalid price' }],
    });
  });

  it('throws if API returns an invalid decimal', () => {
    const dto: SupplierProductDto = {
      product_id: 1,
      supplier_price: 'abc',
    };

    expect(() => SupplierProductMapper.fromDto(dto)).toThrow('Invalid decimal value received from API.');
  });
});
