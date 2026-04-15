import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { Product } from '@domain/models/product.model';
import {
  AddSupplierProductRequest,
  SupplierProduct,
  SupplierProductQueryParams,
} from '@domain/models/supplier-product.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier-product/get-supplier-products.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';
import {
  SupplierProductApiError,
  SupplierProductDuplicateError,
  SupplierProductForbiddenError,
  SupplierProductItemInactiveError,
  SupplierProductNotFoundError,
  SupplierProductSupplierInactiveError,
  SupplierProductUnauthorizedError,
  SupplierProductValidationError,
} from '@domain/models/supplier-product-errors';

@Injectable()
export class SupplierProductsStore {
  private readonly authService = inject(AuthService);
  private readonly getSupplierProductsUseCase = inject(GetSupplierProductsUseCase);
  private readonly addProductToSupplierUseCase = inject(AddProductToSupplierUseCase);
  private readonly updateSupplierProductPriceUseCase = inject(UpdateSupplierProductPriceUseCase);
  private readonly removeProductFromSupplierUseCase = inject(RemoveProductFromSupplierUseCase);
  private readonly getProductsUseCase = inject(GetProductsUseCase);

  readonly supplierProducts = signal<SupplierProduct[]>([]);
  readonly supplierId = signal<number | null>(null);
  readonly supplierTotal = signal(0);
  readonly supplierPage = signal(1);
  readonly supplierPageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly productsLoading = signal(false);
  readonly activeProducts = signal<Product[]>([]);
  readonly selectedProductId = signal<number | null>(null);
  readonly addProductPriceDraft = signal('');
  readonly addProductDialogVisible = signal(false);
  readonly confirmDeleteProductDialogVisible = signal(false);
  readonly selectedSupplierProduct = signal<SupplierProduct | null>(null);
  readonly editingProductId = signal<number | null>(null);
  readonly priceDraft = signal('');
  readonly savingProductIds = signal<ReadonlySet<number>>(new Set<number>());

  readonly canModify = computed(() =>
    this.authService.hasPermission([UserPermission.Admin, UserPermission.PurchasesManager])
  );
  readonly supplierTotalPages = computed(() => Math.ceil(this.supplierTotal() / this.supplierPageSize()));
  readonly activeProductsForAdd = computed(() => {
    const associated = new Set(this.supplierProducts().map((item) => item.productId));
    return this.activeProducts().filter((product) => product.isActive && !associated.has(product.productId));
  });

  private buildQueryParams(): SupplierProductQueryParams {
    return { page: this.supplierPage(), pageSize: this.supplierPageSize() };
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof SupplierProductValidationError) {
      const map: Record<string, string> = {
        'Invalid supplier ID.': 'ID de proveedor invalido.',
        'Invalid product ID.': 'ID de producto invalido.',
        'Supplier price must be greater than zero.': 'El precio del proveedor debe ser mayor que cero.',
        'Excel file is required for import.': 'Se requiere archivo Excel para importar.',
        'Page must be greater than 0.': 'La pagina debe ser mayor que 0.',
        'Page size must be between 1 and 100.': 'El tamano de pagina debe estar entre 1 y 100.',
        'Supplier price must have maximum 2 decimal places.': 'El precio del proveedor debe tener maximo 2 decimales.',
      };
      return map[err.message] ?? 'Por favor, verifique los datos enviados.';
    }
    if (err instanceof SupplierProductUnauthorizedError) return 'Su sesion ha expirado. Por favor, inicie sesion nuevamente.';
    if (err instanceof SupplierProductForbiddenError) return 'No tiene permisos para realizar esta accion.';
    if (err instanceof SupplierProductNotFoundError) return 'La asociacion seleccionada ya no existe.';
    if (err instanceof SupplierProductDuplicateError) return 'El producto ya esta asociado con este proveedor.';
    if (err instanceof SupplierProductSupplierInactiveError) return 'Solo se pueden asociar proveedores activos.';
    if (err instanceof SupplierProductItemInactiveError) return 'Solo se pueden asociar productos activos.';
    if (err instanceof SupplierProductApiError) return err.message || fallback;
    return fallback;
  }

  private ensureCanModify(): boolean {
    if (this.canModify()) return true;
    this.error.set('No tiene permisos para realizar esta accion.');
    return false;
  }

  private requireSupplierId(): number | null {
    const currentSupplierId = this.supplierId();
    if (!currentSupplierId) this.error.set('No hay proveedor seleccionado.');
    return currentSupplierId;
  }

  private parseSupplierPrice(value: number | string): number | null {
    const normalized = value.toString().trim().replace(',', '.');
    const price = Number(normalized);
    if (!Number.isFinite(price) || price <= 0) {
      this.error.set('El precio del proveedor debe ser mayor que cero.');
      return null;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      this.error.set('El precio del proveedor debe tener maximo 2 decimales.');
      return null;
    }
    return price;
  }

  private async fetchSupplierProducts(supplierId: number): Promise<void> {
    const result = await firstValueFrom(this.getSupplierProductsUseCase.execute(supplierId, this.buildQueryParams()));
    this.supplierProducts.set(result.data);
    this.supplierTotal.set(result.total);
  }

  async loadSupplierProducts(supplierId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.supplierId.set(supplierId);
    try {
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al cargar productos del proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  onSupplierProductsPageChange(event: { first: number; rows: number }): void {
    this.supplierPage.set(Math.floor(event.first / event.rows) + 1);
    this.supplierPageSize.set(event.rows);
    const supplierId = this.supplierId();
    if (supplierId) void this.loadSupplierProducts(supplierId);
  }

  async loadActiveProductsForAdd(): Promise<void> {
    this.productsLoading.set(true);
    try {
      const result = await firstValueFrom(this.getProductsUseCase.execute({ page: 1, pageSize: 100, active: true }));
      this.activeProducts.set(result.data.filter((product) => product.isActive));
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al cargar productos activos.'));
    } finally {
      this.productsLoading.set(false);
    }
  }

  openAddProductDialog(): void {
    if (!this.ensureCanModify()) return;
    this.selectedProductId.set(null);
    this.addProductPriceDraft.set('');
    this.addProductDialogVisible.set(true);
    void this.loadActiveProductsForAdd();
  }

  closeAddProductDialog(): void {
    this.addProductDialogVisible.set(false);
    this.selectedProductId.set(null);
    this.addProductPriceDraft.set('');
  }

  setSelectedProductId(productId: number | null): void {
    this.selectedProductId.set(productId);
  }

  setAddProductPriceDraft(value: string): void {
    this.addProductPriceDraft.set(value);
  }

  async addSelectedProductToSupplier(): Promise<void> {
    const productId = this.selectedProductId();
    if (!productId) {
      this.error.set('Producto seleccionado invalido.');
      return;
    }
    await this.addProductToSupplier({ productId, supplierPrice: this.addProductPriceDraft() });
  }

  async addProductToSupplier(request: { productId: number; supplierPrice: number | string }): Promise<void> {
    this.error.set(null);
    if (!this.ensureCanModify()) return;
    const supplierId = this.requireSupplierId();
    const supplierPrice = this.parseSupplierPrice(request.supplierPrice);
    if (!supplierId || supplierPrice === null) return;
    this.loading.set(true);
    try {
      const addRequest: AddSupplierProductRequest = { productId: request.productId, supplierPrice };
      await firstValueFrom(this.addProductToSupplierUseCase.execute(supplierId, addRequest));
      this.closeAddProductDialog();
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al agregar producto al proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  startInlinePriceEdit(supplierProduct: SupplierProduct): void {
    if (!this.ensureCanModify()) return;
    this.editingProductId.set(supplierProduct.productId);
    this.priceDraft.set(supplierProduct.supplierPrice.toString());
  }

  cancelInlinePriceEdit(): void {
    this.editingProductId.set(null);
    this.priceDraft.set('');
  }

  setPriceDraft(value: string): void {
    this.priceDraft.set(value);
  }

  async saveInlinePrice(supplierProduct: SupplierProduct): Promise<void> {
    this.error.set(null);
    if (!this.ensureCanModify()) return;
    const supplierId = this.requireSupplierId();
    const supplierPrice = this.parseSupplierPrice(this.priceDraft());
    if (!supplierId || supplierPrice === null) return;
    this.savingProductIds.update((ids) => new Set(ids).add(supplierProduct.productId));
    try {
      await firstValueFrom(
        this.updateSupplierProductPriceUseCase.execute(supplierId, supplierProduct.productId, { supplierPrice }),
      );
      this.cancelInlinePriceEdit();
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al actualizar precio del producto.'));
    } finally {
      this.savingProductIds.update((ids) => {
        const next = new Set(ids);
        next.delete(supplierProduct.productId);
        return next;
      });
    }
  }

  requestDeleteProduct(supplierProduct: SupplierProduct): void {
    if (!this.ensureCanModify()) return;
    this.selectedSupplierProduct.set(supplierProduct);
    this.confirmDeleteProductDialogVisible.set(true);
  }

  cancelDeleteProduct(): void {
    this.confirmDeleteProductDialogVisible.set(false);
    this.selectedSupplierProduct.set(null);
  }

  async confirmDeleteProduct(): Promise<void> {
    this.error.set(null);
    if (!this.ensureCanModify()) return;
    const supplierId = this.requireSupplierId();
    const supplierProduct = this.selectedSupplierProduct();
    if (!supplierId || !supplierProduct) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.removeProductFromSupplierUseCase.execute(supplierId, supplierProduct.productId));
      this.cancelDeleteProduct();
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al eliminar producto del proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

}
