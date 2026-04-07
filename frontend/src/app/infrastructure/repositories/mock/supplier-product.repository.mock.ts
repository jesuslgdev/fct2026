import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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

interface MockSupplierProductRecord {
  supplierId: number;
  product: SupplierProduct;
}

const INITIAL_MOCK_SUPPLIER_PRODUCTS: MockSupplierProductRecord[] = [
  {
    supplierId: 1,
    product: {
      productId: 1,
      productCode: 'PROD001',
      productName: 'Laptop Dell XPS 15',
      categoryName: 'Electrónica',
      supplierPrice: 1200.5,
    },
  },
  {
    supplierId: 1,
    product: {
      productId: 2,
      productCode: 'PROD002',
      productName: 'Mouse Logitech MX Master',
      categoryName: 'Accesorios',
      supplierPrice: 89.99,
    },
  },
  {
    supplierId: 2,
    product: {
      productId: 3,
      productCode: 'PROD003',
      productName: 'Monitor LG 27"',
      categoryName: 'Electrónica',
      supplierPrice: 350,
    },
  },
];

@Injectable()
export class MockSupplierProductRepository implements SupplierProductRepository {
  private supplierProducts: MockSupplierProductRecord[];

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

  private findSupplierProduct(supplierId: number, productId: number): MockSupplierProductRecord | undefined {
    return this.supplierProducts.find((sp) => sp.supplierId === supplierId && sp.product.productId === productId);
  }

  private findSupplierProductOrThrow(supplierId: number, productId: number): MockSupplierProductRecord {
    const supplierProduct = this.findSupplierProduct(supplierId, productId);
    if (!supplierProduct) {
      throw new SupplierProductNotFoundError('Supplier product association not found');
    }
    return supplierProduct;
  }

  getSupplierProducts(supplierId: number): Observable<SupplierProduct[]> {
    return of(
      this.supplierProducts
        .filter((sp) => sp.supplierId === supplierId)
        .map((sp) => ({ ...sp.product })),
    );
  }

  addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Observable<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    // Check if product already exists for this supplier
    const existing = this.findSupplierProduct(supplierId, request.productId);
    if (existing) {
      throw new SupplierProductDuplicateError('Product already associated with this supplier');
    }

    const newSupplierProduct: SupplierProduct = {
      productId: request.productId,
      productCode: `PROD${request.productId.toString().padStart(3, '0')}`,
      productName: `Product ${request.productId}`,
      categoryName: 'General',
      supplierPrice: request.supplierPrice,
    };

    this.supplierProducts = [
      ...this.supplierProducts,
      {
        supplierId,
        product: newSupplierProduct,
      },
    ];

    return of({ ...newSupplierProduct });
  }

  updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Observable<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    const existing = this.findSupplierProductOrThrow(supplierId, productId);

    const updated: SupplierProduct = {
      ...existing.product,
      supplierPrice: request.supplierPrice,
    };

    this.supplierProducts = this.supplierProducts.map((sp) =>
      sp.supplierId === supplierId && sp.product.productId === productId
        ? { ...sp, product: updated }
        : sp
    );

    return of({ ...updated });
  }

  removeProductFromSupplier(supplierId: number, productId: number): Observable<void> {
    this.findSupplierProductOrThrow(supplierId, productId);

    this.supplierProducts = this.supplierProducts.filter((sp) =>
      !(sp.supplierId === supplierId && sp.product.productId === productId)
    );

    return of(void 0);
  }

  importSupplierProducts(supplierId: number, _request: ImportSupplierProductsRequest): Observable<ImportResult> {
    const currentCount = this.supplierProducts.filter((sp) => sp.supplierId === supplierId).length;

    return of({
      total: currentCount,
      created: 0,
      errors: 0,
      error_detail: [],
    });
  }
}
