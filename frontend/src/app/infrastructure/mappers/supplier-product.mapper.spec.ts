import { describe, expect, it } from 'vitest';
import { SupplierProductMapper } from '@infrastructure/mappers/supplier-product.mapper';
import {
  SupplierProductDto,
  SupplierProductsPageDto,
  ImportResultDto,
  ProductSupplierDto,
  ProductSuppliersPageDto,
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

  it('maps page DTO to paginated result', () => {
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

    const result = SupplierProductMapper.fromSupplierProductsPageDto(dto);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.productId).toBe(1);
    expect(result.data[0]?.supplierPrice).toBe(9.99);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
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

  it('maps ProductSupplierDto to ProductSupplier', () => {
    const dto: ProductSupplierDto = {
      supplier_id: 1,
      supplier_name: 'Supplier 1',
      tax_id: 'B12345678',
      supplier_price: '100.50',
    };

    const result = SupplierProductMapper.fromProductSupplierDto(dto);

    expect(result.supplierId).toBe(1);
    expect(result.supplierName).toBe('Supplier 1');
    expect(result.taxId).toBe('B12345678');
    expect(result.supplierPrice).toBe(100.50);
  });

  it('maps ProductSuppliersPageDto to PagedResult<ProductSupplier>', () => {
    const dto: ProductSuppliersPageDto = {
      items: [
        {
          supplier_id: 1,
          supplier_name: 'Supplier 1',
          tax_id: 'B12345678',
          supplier_price: '100.50',
        }
      ],
      total: 1,
      page: 1,
      page_size: 10,
    };

    const result = SupplierProductMapper.fromProductSuppliersPageDto(dto);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.supplierId).toBe(1);
    expect(result.data[0]?.supplierName).toBe('Supplier 1');
    expect(result.data[0]?.taxId).toBe('B12345678');
    expect(result.data[0]?.supplierPrice).toBe(100.50);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });
});
