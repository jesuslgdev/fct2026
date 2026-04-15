import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { Provider } from '@domain/models/provider.model';
import {
  AddSupplierProductRequest,
  ProductSupplier,
  ProductSupplierQueryParams,
  UpdateSupplierProductPriceRequest,
} from '@domain/models/supplier-product.model';
import { GetProvidersUseCase } from '@domain/usecases/supplier/get-providers.usecase';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { GetProductSuppliersUseCase } from '@domain/usecases/supplier-product/get-product-suppliers.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';
import {
  SupplierProductApiError,
  SupplierProductDuplicateError,
  SupplierProductForbiddenError,
  SupplierProductNotFoundError,
  SupplierProductUnauthorizedError,
  SupplierProductValidationError,
} from '@domain/models/supplier-product-errors';

@Injectable()
export class ProductSuppliersStore {
  private readonly authService = inject(AuthService);
  private readonly getProductSuppliersUseCase = inject(GetProductSuppliersUseCase);
  private readonly addProductToSupplierUseCase = inject(AddProductToSupplierUseCase);
  private readonly updateSupplierProductPriceUseCase = inject(UpdateSupplierProductPriceUseCase);
  private readonly removeProductFromSupplierUseCase = inject(RemoveProductFromSupplierUseCase);
  private readonly getProvidersUseCase = inject(GetProvidersUseCase);

  readonly productSuppliers = signal<ProductSupplier[]>([]);
  readonly productId = signal<number | null>(null);
  readonly productTotal = signal(0);
  readonly productPage = signal(1);
  readonly productPageSize = signal(10);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly suppliersLoading = signal(false);

  readonly addSupplierDialogVisible = signal(false);
  readonly editSupplierPriceDialogVisible = signal(false);
  readonly confirmDeleteSupplierDialogVisible = signal(false);
  readonly selectedProductSupplier = signal<ProductSupplier | null>(null);
  readonly activeSuppliers = signal<Provider[]>([]);
  readonly selectedSupplierId = signal<string | null>(null);
  readonly addSupplierPriceDraft = signal('');
  readonly editingSupplierId = signal<number | null>(null);
  readonly priceDraft = signal('');
  readonly savingSupplierIds = signal<ReadonlySet<number>>(new Set<number>());

  readonly canModify = computed(() =>
    this.authService.hasPermission([UserPermission.Admin, UserPermission.PurchasesManager])
  );

  readonly productTotalPages = computed(() => Math.ceil(this.productTotal() / this.productPageSize()));

  readonly activeSuppliersForAdd = computed(() => {
    const associatedSupplierIds = new Set(
      this.productSuppliers().map((supplier) => supplier.supplierId.toString()),
    );

    return this.activeSuppliers().filter((supplier) => !associatedSupplierIds.has(supplier.id));
  });

  private buildQueryParams(): ProductSupplierQueryParams {
    return {
      page: this.productPage(),
      pageSize: this.productPageSize(),
    };
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof SupplierProductValidationError) {
      const validationMessageMap: Record<string, string> = {
        'Invalid supplier ID.': 'ID de proveedor invalido.',
        'Invalid product ID.': 'ID de producto invalido.',
        'Supplier price must be greater than zero.': 'El precio del proveedor debe ser mayor que cero.',
        'Excel file is required for import.': 'Se requiere archivo Excel para importar.',
        'Invalid price.': 'Precio invalido.',
        'Page must be greater than 0.': 'La pagina debe ser mayor que 0.',
        'Page size must be between 1 and 100.': 'El tamano de pagina debe estar entre 1 y 100.',
        'Supplier price must be greater than 0': 'El precio del proveedor debe ser mayor que cero.',
        'Supplier price must have maximum 2 decimal places.': 'El precio del proveedor debe tener maximo 2 decimales.',
      };

      return validationMessageMap[err.message] ?? 'Por favor, verifique los datos enviados.';
    }

    if (err instanceof SupplierProductUnauthorizedError) {
      return 'Su sesion ha expirado. Por favor, inicie sesion nuevamente.';
    }

    if (err instanceof SupplierProductForbiddenError) {
      return 'No tiene permisos para realizar esta accion.';
    }

    if (err instanceof SupplierProductNotFoundError) {
      return 'La asociacion seleccionada ya no existe.';
    }

    if (err instanceof SupplierProductDuplicateError) {
      return 'El producto ya esta asociado con este proveedor.';
    }

    if (err instanceof SupplierProductApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  private requireProductId(message: string): number | null {
    const currentProductId = this.productId();
    if (!currentProductId) {
      this.error.set(message);
      return null;
    }

    return currentProductId;
  }

  private requireSelectedProductSupplier(message: string): ProductSupplier | null {
    const currentProductSupplier = this.selectedProductSupplier();
    if (!currentProductSupplier) {
      this.error.set(message);
      return null;
    }

    return currentProductSupplier;
  }

  private ensureCanModify(): boolean {
    if (this.canModify()) {
      return true;
    }

    this.error.set('No tiene permisos para realizar esta accion.');
    return false;
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

  private parseSupplierId(value: string | null): number | null {
    const supplierId = Number(value);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      this.error.set('Proveedor seleccionado invalido.');
      return null;
    }

    return supplierId;
  }

  private async fetchProductSuppliers(productId: number): Promise<void> {
    const result = await firstValueFrom(this.getProductSuppliersUseCase.execute(productId, this.buildQueryParams()));
    this.productSuppliers.set(result.data);
    this.productTotal.set(result.total);
  }

  private async refreshAfterMutation(productId: number, fallback: string): Promise<void> {
    try {
      await this.fetchProductSuppliers(productId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, fallback));
    }
  }

  async loadActiveSuppliersForAdd(): Promise<void> {
    this.suppliersLoading.set(true);

    try {
      const result = await this.getProvidersUseCase.execute({
        page: 1,
        rows: 100,
        first: 0,
        status: ProviderStatus.ACTIVE,
        isActive: true,
      });
      this.activeSuppliers.set(result.data.filter((supplier) => supplier.isActive));
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al cargar proveedores activos.'));
    } finally {
      this.suppliersLoading.set(false);
    }
  }

  async loadProductSuppliers(productId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.productId.set(productId);

    try {
      await this.fetchProductSuppliers(productId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al cargar proveedores del producto.'));
    } finally {
      this.loading.set(false);
    }
  }

  openAddSupplierDialog(): void {
    if (!this.ensureCanModify()) {
      return;
    }

    this.selectedProductSupplier.set(null);
    this.selectedSupplierId.set(null);
    this.addSupplierPriceDraft.set('');
    this.addSupplierDialogVisible.set(true);
    void this.loadActiveSuppliersForAdd();
  }

  closeAddSupplierDialog(): void {
    this.addSupplierDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
    this.selectedSupplierId.set(null);
    this.addSupplierPriceDraft.set('');
  }

  setSelectedSupplierId(supplierId: string | null): void {
    this.selectedSupplierId.set(supplierId);
  }

  setAddSupplierPriceDraft(value: string): void {
    this.addSupplierPriceDraft.set(value);
  }

  async addSelectedSupplierToProduct(): Promise<void> {
    this.error.set(null);

    if (!this.ensureCanModify()) {
      return;
    }

    const supplierId = this.parseSupplierId(this.selectedSupplierId());
    if (supplierId === null) {
      return;
    }

    await this.addSupplierToProduct({
      supplierId,
      supplierPrice: this.addSupplierPriceDraft(),
    });
  }

  async addSupplierToProduct(request: { supplierId: number; supplierPrice: number | string }): Promise<void> {
    this.error.set(null);

    if (!this.ensureCanModify()) {
      return;
    }

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    if (!currentProductId) {
      return;
    }

    const supplierPrice = this.parseSupplierPrice(request.supplierPrice);
    if (supplierPrice === null) {
      return;
    }

    this.loading.set(true);
    try {
      const addRequest: AddSupplierProductRequest = {
        productId: currentProductId,
        supplierPrice,
      };

      await firstValueFrom(this.addProductToSupplierUseCase.execute(request.supplierId, addRequest));
      this.closeAddSupplierDialog();

      await this.refreshAfterMutation(
        currentProductId,
        'Se agrego la asociacion, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al agregar proveedor al producto.'));
    } finally {
      this.loading.set(false);
    }
  }

  openEditSupplierPriceDialog(productSupplier: ProductSupplier): void {
    if (!this.ensureCanModify()) {
      return;
    }

    this.selectedProductSupplier.set(productSupplier);
    this.editSupplierPriceDialogVisible.set(true);
  }

  closeEditSupplierPriceDialog(): void {
    this.editSupplierPriceDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
  }

  startInlinePriceEdit(productSupplier: ProductSupplier): void {
    if (!this.ensureCanModify()) {
      return;
    }

    this.editingSupplierId.set(productSupplier.supplierId);
    this.priceDraft.set(productSupplier.supplierPrice.toString());
  }

  cancelInlinePriceEdit(): void {
    this.editingSupplierId.set(null);
    this.priceDraft.set('');
  }

  setPriceDraft(value: string): void {
    this.priceDraft.set(value);
  }

  async saveInlinePrice(productSupplier: ProductSupplier): Promise<void> {
    this.error.set(null);

    if (!this.ensureCanModify()) {
      return;
    }

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    if (!currentProductId) {
      return;
    }

    const supplierPrice = this.parseSupplierPrice(this.priceDraft());
    if (supplierPrice === null) {
      return;
    }

    this.savingSupplierIds.update((ids) => new Set(ids).add(productSupplier.supplierId));
    try {
      await firstValueFrom(
        this.updateSupplierProductPriceUseCase.execute(
          productSupplier.supplierId,
          currentProductId,
          { supplierPrice },
        ),
      );
      this.cancelInlinePriceEdit();
      await this.refreshAfterMutation(
        currentProductId,
        'Se actualizo el precio, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al actualizar precio del proveedor.'));
    } finally {
      this.savingSupplierIds.update((ids) => {
        const next = new Set(ids);
        next.delete(productSupplier.supplierId);
        return next;
      });
    }
  }

  async updateSupplierPrice(request: UpdateSupplierProductPriceRequest): Promise<void> {
    this.error.set(null);

    if (!this.ensureCanModify()) {
      return;
    }

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    const currentProductSupplier = this.requireSelectedProductSupplier('No hay proveedor seleccionado.');
    if (!currentProductId || !currentProductSupplier) {
      return;
    }

    const supplierPrice = this.parseSupplierPrice(request.supplierPrice);
    if (supplierPrice === null) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.updateSupplierProductPriceUseCase.execute(
          currentProductSupplier.supplierId,
          currentProductId,
          { supplierPrice },
        ),
      );

      this.closeEditSupplierPriceDialog();
      await this.refreshAfterMutation(
        currentProductId,
        'Se actualizo el precio, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al actualizar precio del proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  requestDeleteSupplier(productSupplier: ProductSupplier): void {
    if (!this.ensureCanModify()) {
      return;
    }

    this.selectedProductSupplier.set(productSupplier);
    this.confirmDeleteSupplierDialogVisible.set(true);
  }

  cancelDeleteSupplier(): void {
    this.confirmDeleteSupplierDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
  }

  async confirmDeleteSupplier(): Promise<void> {
    this.error.set(null);

    if (!this.ensureCanModify()) {
      return;
    }

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    const currentProductSupplier = this.requireSelectedProductSupplier('No hay proveedor seleccionado.');
    if (!currentProductId || !currentProductSupplier) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.removeProductFromSupplierUseCase.execute(
          currentProductSupplier.supplierId,
          currentProductId,
        ),
      );

      this.confirmDeleteSupplierDialogVisible.set(false);
      this.selectedProductSupplier.set(null);

      await this.refreshAfterMutation(
        currentProductId,
        'Se elimino la asociacion, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al eliminar proveedor del producto.'));
    } finally {
      this.loading.set(false);
    }
  }

  onProductPageChange(event: { first: number; rows: number }): void {
    this.productPage.set(Math.floor(event.first / event.rows) + 1);
    this.productPageSize.set(event.rows);

    const currentProductId = this.productId();
    if (currentProductId) {
      void this.loadProductSuppliers(currentProductId);
    }
  }
}
