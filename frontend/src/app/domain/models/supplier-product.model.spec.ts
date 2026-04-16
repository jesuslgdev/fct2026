import { describe, it, expect } from 'vitest';
import { SupplierProduct } from './supplier-product.model';

describe('SupplierProduct', () => {
  const mockProviderProduct: SupplierProduct = {
    id: '1',
    productId: 'prod-1',
    productName: 'Test Product',
    supplierId: 'prov-1',
    specificPrice: 99.99,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should create a valid supplier product', () => {
    expect(mockProviderProduct.id).toBe('1');
    expect(mockProviderProduct.productId).toBe('prod-1');
    expect(mockProviderProduct.productName).toBe('Test Product');
    expect(mockProviderProduct.supplierId).toBe('prov-1');
    expect(mockProviderProduct.specificPrice).toBe(99.99);
    expect(mockProviderProduct.createdAt).toBeInstanceOf(Date);
    expect(mockProviderProduct.updatedAt).toBeInstanceOf(Date);
  });

  it('should have all required properties', () => {
    const requiredProps = ['id', 'productId', 'productName', 'supplierId', 'specificPrice', 'createdAt', 'updatedAt'];
    requiredProps.forEach(prop => {
      expect(mockProviderProduct).toHaveProperty(prop);
    });
  });

  it('should accept different price values', () => {
    const cheapProduct: SupplierProduct = {
      ...mockProviderProduct,
      id: '2',
      specificPrice: 0.01
    };
    const expensiveProduct: SupplierProduct = {
      ...mockProviderProduct,
      id: '3',
      specificPrice: 9999.99
    };
    expect(cheapProduct.specificPrice).toBe(0.01);
    expect(expensiveProduct.specificPrice).toBe(9999.99);
  });
});

