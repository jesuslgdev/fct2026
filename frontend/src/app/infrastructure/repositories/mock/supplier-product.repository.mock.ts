import { Injectable } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';
import {
  SupplierProductValidationError,
  SupplierProductNotFoundError,
  SupplierProductDuplicateError,
} from '@domain/models/supplier-product-errors';

const INITIAL_MOCK_SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    supplierId: 1,
    productId: 1,
    productCode: 'PROD001',
    productName: 'Laptop Dell XPS 15',
    categoryName: 'Electrónica',
    supplierPrice: 1200.50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    supplierId: 1,
    productId: 2,
    productCode: 'PROD002',
    productName: 'Mouse Logitech MX Master',
    categoryName: 'Accesorios',
    supplierPrice: 89.99,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    supplierId: 2,
    productId: 3,
    productCode: 'PROD003',
    productName: 'Monitor LG 27"',
    categoryName: 'Electrónica',
    supplierPrice: 350.00,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

@Injectable()
export class MockSupplierProductRepository implements SupplierProductRepository {
  private supplierProducts: SupplierProduct[];

  constructor() {
    this.supplierProducts = INITIAL_MOCK_SUPPLIER_PRODUCTS.map(sp => ({ ...sp }));
  }

  private validatePrice(price: number): void {
    if (price <= 0) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must be greater than 0');
    }

    if (price > 999999.99) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must be less than 999999.99');
    }

    // Validar que tenga máximo 2 decimales
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must have maximum 2 decimal places');
    }
  }

  private findSupplierProduct(supplierId: number, productId: number): SupplierProduct | undefined {
    return this.supplierProducts.find(sp => sp.supplierId === supplierId && sp.productId === productId);
  }

  private findSupplierProductOrThrow(supplierId: number, productId: number): SupplierProduct {
    const supplierProduct = this.findSupplierProduct(supplierId, productId);
    if (!supplierProduct) {
      throw new SupplierProductNotFoundError('Supplier product association not found');
    }
    return supplierProduct;
  }

  async getSupplierProducts(supplierId: number): Promise<SupplierProduct[]> {
    return this.supplierProducts
      .filter(sp => sp.supplierId === supplierId)
      .map(sp => ({ ...sp }));
  }

  async addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Promise<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    // Check if product already exists for this supplier
    const existing = this.findSupplierProduct(supplierId, request.productId);
    if (existing) {
      throw new SupplierProductDuplicateError('Product already associated with this supplier');
    }

    const newSupplierProduct: SupplierProduct = {
      supplierId,
      productId: request.productId,
      productCode: `PROD${request.productId.toString().padStart(3, '0')}`,
      productName: `Product ${request.productId}`,
      categoryName: 'General',
      supplierPrice: request.supplierPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.supplierProducts = [...this.supplierProducts, newSupplierProduct];
    return { ...newSupplierProduct };
  }

  async updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Promise<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    const existing = this.findSupplierProductOrThrow(supplierId, productId);

    const updated: SupplierProduct = {
      ...existing,
      supplierPrice: request.supplierPrice,
      updatedAt: new Date().toISOString(),
    };

    this.supplierProducts = this.supplierProducts.map(sp => 
      sp.supplierId === supplierId && sp.productId === productId ? updated : sp
    );

    return { ...updated };
  }

  async removeProductFromSupplier(supplierId: number, productId: number): Promise<void> {
    this.findSupplierProductOrThrow(supplierId, productId);

    this.supplierProducts = this.supplierProducts.filter(sp => 
      !(sp.supplierId === supplierId && sp.productId === productId)
    );
  }

  async importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Promise<ImportResult> {
    const errors: { row: number; reason: string }[] = [];
    let created = 0;

    for (const [index, product] of request.products.entries()) {
      try {
        // Validar productCode
        if (!product.productCode || product.productCode.trim() === '') {
          errors.push({
            row: index + 1,
            reason: 'Product code is required',
          });
          continue;
        }

        // Validar precio
        this.validatePrice(product.supplierPrice);

        // Simular productId basado en productCode
        const productId = parseInt(product.productCode.replace('PROD', ''));

        // Intentar añadir el producto
        await this.addProductToSupplier(supplierId, {
          productId,
          supplierPrice: product.supplierPrice,
        });

        created++;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          row: index + 1,
          reason,
        });
      }
    }

    return {
      total: request.products.length,
      created,
      errors,
    };
  }
}
