import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { Provider } from '@domain/models/provider.model';
import {
  PagedResult,
  ProductSupplier,
  ProductSupplierQueryParams,
  UpdateSupplierProductPriceRequest,
} from '@domain/models/supplier-product.model';
import { GetProvidersUseCase } from '@domain/usecases/supplier/get-providers.usecase';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { GetProductSuppliersUseCase } from '@domain/usecases/supplier-product/get-product-suppliers.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';
import { ProductSuppliersStore } from '@features/supplier-product/state/product-suppliers.store';

const PRODUCT_SUPPLIER_A: ProductSupplier = {
  supplierId: 1,
  supplierName: 'Proveedor A',
  taxId: 'B12345678',
  supplierPrice: 100,
};

const PRODUCT_SUPPLIER_B: ProductSupplier = {
  supplierId: 2,
  supplierName: 'Proveedor B',
  taxId: 'B87654321',
  supplierPrice: 90,
};

const ACTIVE_PROVIDER_A: Provider = {
  id: '1',
  name: 'Proveedor A',
  taxId: 'B12345678',
  email: 'a@example.com',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const ACTIVE_PROVIDER_C: Provider = {
  ...ACTIVE_PROVIDER_A,
  id: '3',
  name: 'Proveedor C',
  taxId: 'B11111111',
  email: 'c@example.com',
};

class MockAuthService {
  readonly permissions = signal<UserPermission[]>([UserPermission.PurchasesManager]);
  readonly user = signal({
    uid: 'uid-1',
    email: 'manager@example.com',
    displayName: 'Manager',
    photoURL: null,
    role: 'Manager' as const,
  });

  hasPermission(permission: UserPermission | UserPermission[]): boolean {
    if (Array.isArray(permission)) {
      return permission.some((p) => this.permissions().includes(p));
    }
    return this.permissions().includes(permission);
  }
}

class MockGetProductSuppliersUseCase {
  execute = vi.fn<(productId: number, params?: ProductSupplierQueryParams) => unknown>();
}

class MockAddProductToSupplierUseCase {
  execute = vi.fn();
}

class MockUpdateSupplierProductPriceUseCase {
  execute = vi.fn();
}

class MockRemoveProductFromSupplierUseCase {
  execute = vi.fn();
}

class MockGetProvidersUseCase {
  execute = vi.fn();
}

describe('ProductSuppliersStore', () => {
  let store: ProductSuppliersStore;
  let getProductSuppliersUseCase: MockGetProductSuppliersUseCase;
  let addProductToSupplierUseCase: MockAddProductToSupplierUseCase;
  let updateSupplierProductPriceUseCase: MockUpdateSupplierProductPriceUseCase;
  let removeProductFromSupplierUseCase: MockRemoveProductFromSupplierUseCase;
  let getProvidersUseCase: MockGetProvidersUseCase;

  beforeEach(() => {
    getProductSuppliersUseCase = new MockGetProductSuppliersUseCase();
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    updateSupplierProductPriceUseCase = new MockUpdateSupplierProductPriceUseCase();
    removeProductFromSupplierUseCase = new MockRemoveProductFromSupplierUseCase();
    getProvidersUseCase = new MockGetProvidersUseCase();

    TestBed.configureTestingModule({
      providers: [
        ProductSuppliersStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetProductSuppliersUseCase, useValue: getProductSuppliersUseCase },
        { provide: AddProductToSupplierUseCase, useValue: addProductToSupplierUseCase },
        { provide: UpdateSupplierProductPriceUseCase, useValue: updateSupplierProductPriceUseCase },
        { provide: RemoveProductFromSupplierUseCase, useValue: removeProductFromSupplierUseCase },
        { provide: GetProvidersUseCase, useValue: getProvidersUseCase },
      ],
    });

    store = TestBed.inject(ProductSuppliersStore);
  });

  it('carga proveedores de producto', async () => {
    const response: PagedResult<ProductSupplier> = {
      data: [PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B],
      total: 2,
      page: 1,
      pageSize: 10,
    };

    getProductSuppliersUseCase.execute.mockReturnValue(of(response));

    await store.loadProductSuppliers(12);

    expect(getProductSuppliersUseCase.execute).toHaveBeenCalledWith(12, { page: 1, pageSize: 10 });
    expect(store.productSuppliers()).toEqual([PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B]);
    expect(store.productTotal()).toBe(2);
  });

  it('no agrega proveedor si no hay producto seleccionado', async () => {
    await store.addSupplierToProduct({ supplierId: 2, supplierPrice: 50 });

    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    expect(store.error()).toBe('No hay producto seleccionado.');
  });

  it('bloquea precio con mas de dos decimales antes del use case', async () => {
    store.productId.set(1);

    await store.addSupplierToProduct({ supplierId: 2, supplierPrice: 10.123 });

    expect(store.error()).toBe('El precio del proveedor debe tener maximo 2 decimales.');
    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
  });

  it('agrega proveedor y recarga la lista', async () => {
    getProductSuppliersUseCase.execute
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B], total: 2, page: 1, pageSize: 10 }));

    await store.loadProductSuppliers(1);

    addProductToSupplierUseCase.execute.mockReturnValue(of(undefined));

    await store.addSupplierToProduct({ supplierId: 2, supplierPrice: 90 });

    expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(2, {
      productId: 1,
      supplierPrice: 90,
    });
    expect(store.productSuppliers()).toEqual([PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B]);
  });

  it('agrega proveedor seleccionado desde el modal', async () => {
    store.productId.set(1);
    store.setSelectedSupplierId('2');
    store.setAddSupplierPriceDraft('90.50');
    addProductToSupplierUseCase.execute.mockReturnValue(of(undefined));
    getProductSuppliersUseCase.execute.mockReturnValue(
      of({ data: [PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B], total: 2, page: 1, pageSize: 10 }),
    );

    await store.addSelectedSupplierToProduct();

    expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(2, {
      productId: 1,
      supplierPrice: 90.5,
    });
    expect(store.addSupplierDialogVisible()).toBe(false);
  });

  it('bloquea proveedor seleccionado con id no numerico', async () => {
    store.productId.set(1);
    store.setSelectedSupplierId('abc');
    store.setAddSupplierPriceDraft('90');

    await store.addSelectedSupplierToProduct();

    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    expect(store.error()).toBe('Proveedor seleccionado invalido.');
  });

  it('actualiza precio y recarga lista', async () => {
    const payload: UpdateSupplierProductPriceRequest = { supplierPrice: 120 };

    getProductSuppliersUseCase.execute
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [{ ...PRODUCT_SUPPLIER_A, supplierPrice: 120 }], total: 1, page: 1, pageSize: 10 }));

    await store.loadProductSuppliers(1);

    updateSupplierProductPriceUseCase.execute.mockReturnValue(of(undefined));

    store.openEditSupplierPriceDialog(PRODUCT_SUPPLIER_A);
    await store.updateSupplierPrice(payload);

    expect(updateSupplierProductPriceUseCase.execute).toHaveBeenCalledWith(1, 1, payload);
    expect(store.productSuppliers()[0]?.supplierPrice).toBe(120);
  });

  it('edita precio inline y recarga lista', async () => {
    getProductSuppliersUseCase.execute
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [{ ...PRODUCT_SUPPLIER_A, supplierPrice: 115.5 }], total: 1, page: 1, pageSize: 10 }));

    await store.loadProductSuppliers(1);
    updateSupplierProductPriceUseCase.execute.mockReturnValue(of(undefined));

    store.startInlinePriceEdit(PRODUCT_SUPPLIER_A);
    store.setPriceDraft('115.50');
    await store.saveInlinePrice(PRODUCT_SUPPLIER_A);

    expect(updateSupplierProductPriceUseCase.execute).toHaveBeenCalledWith(1, 1, { supplierPrice: 115.5 });
    expect(store.editingSupplierId()).toBeNull();
    expect(store.productSuppliers()[0]?.supplierPrice).toBe(115.5);
  });

  it('bloquea precio inline invalido', async () => {
    store.productId.set(1);
    store.startInlinePriceEdit(PRODUCT_SUPPLIER_A);
    store.setPriceDraft('10.123');

    await store.saveInlinePrice(PRODUCT_SUPPLIER_A);

    expect(updateSupplierProductPriceUseCase.execute).not.toHaveBeenCalled();
    expect(store.error()).toBe('El precio del proveedor debe tener maximo 2 decimales.');
  });

  it('carga proveedores activos y excluye asociados', async () => {
    store.productSuppliers.set([PRODUCT_SUPPLIER_A]);
    getProvidersUseCase.execute.mockResolvedValue({
      data: [ACTIVE_PROVIDER_A, ACTIVE_PROVIDER_C],
      total: 2,
    });

    await store.loadActiveSuppliersForAdd();

    expect(getProvidersUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      rows: 100,
      first: 0,
      status: ProviderStatus.ACTIVE,
      isActive: true,
    });
    expect(store.activeSuppliersForAdd()).toEqual([ACTIVE_PROVIDER_C]);
  });

  it('elimina proveedor y recarga lista', async () => {
    getProductSuppliersUseCase.execute
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A, PRODUCT_SUPPLIER_B], total: 2, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_B], total: 1, page: 1, pageSize: 10 }));

    await store.loadProductSuppliers(1);

    removeProductFromSupplierUseCase.execute.mockReturnValue(of(undefined));

    store.requestDeleteSupplier(PRODUCT_SUPPLIER_A);
    await store.confirmDeleteSupplier();

    expect(removeProductFromSupplierUseCase.execute).toHaveBeenCalledWith(1, 1);
    expect(store.productSuppliers()).toEqual([PRODUCT_SUPPLIER_B]);
  });

  it('onProductPageChange actualiza pagina y recarga', async () => {
    getProductSuppliersUseCase.execute
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [PRODUCT_SUPPLIER_B], total: 1, page: 2, pageSize: 10 }));

    await store.loadProductSuppliers(1);
    store.onProductPageChange({ first: 10, rows: 10 });

    expect(store.productPage()).toBe(2);
    expect(getProductSuppliersUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it('permite modificar para manager', () => {
    expect(store.canModify()).toBe(true);
  });

  it('no permite modificar sin permisos de compras/admin', async () => {
    const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authService.permissions.set([]);

    store.productId.set(1);
    await store.addSupplierToProduct({ supplierId: 2, supplierPrice: 50 });

    expect(store.canModify()).toBe(false);
    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
  });
});
