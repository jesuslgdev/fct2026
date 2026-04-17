import { describe, it, expect } from 'vitest';
import { ProviderProduct } from './provider-product.model';

describe('ProviderProduct', () => {
  const mockProviderProduct: ProviderProduct = {
    id: '1',
    productId: 'prod-1',
    productName: 'Test Product',
    providerId: 'prov-1',
    specificPrice: 99.99,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should create a valid provider product', () => {
    expect(mockProviderProduct.id).toBe('1');
    expect(mockProviderProduct.productId).toBe('prod-1');
    expect(mockProviderProduct.productName).toBe('Test Product');
    expect(mockProviderProduct.providerId).toBe('prov-1');
    expect(mockProviderProduct.specificPrice).toBe(99.99);
    expect(mockProviderProduct.createdAt).toBeInstanceOf(Date);
    expect(mockProviderProduct.updatedAt).toBeInstanceOf(Date);
  });

  it('should have all required properties', () => {
    const requiredProps = ['id', 'productId', 'productName', 'providerId', 'specificPrice', 'createdAt', 'updatedAt'];
    requiredProps.forEach(prop => {
      expect(mockProviderProduct).toHaveProperty(prop);
    });
  });

  it('should accept different price values', () => {
    const cheapProduct: ProviderProduct = {
      ...mockProviderProduct,
      id: '2',
      specificPrice: 0.01
    };
    const expensiveProduct: ProviderProduct = {
      ...mockProviderProduct,
      id: '3',
      specificPrice: 9999.99
    };
    expect(cheapProduct.specificPrice).toBe(0.01);
    expect(expensiveProduct.specificPrice).toBe(9999.99);
  });
});
