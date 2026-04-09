import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import {
  AddSupplierProductRequest,
  ProductSupplier,
  ProductSupplierQueryParams,
  UpdateSupplierProductPriceRequest,
} from '@domain/models/supplier-product.model';
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

  readonly productSuppliers = signal<ProductSupplier[]>([]);
  readonly productId = signal<number | null>(null);
  readonly productTotal = signal(0);
  readonly productPage = signal(1);
  readonly productPageSize = signal(10);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly addSupplierDialogVisible = signal(false);
  readonly editSupplierPriceDialogVisible = signal(false);
  readonly confirmDeleteSupplierDialogVisible = signal(false);
  readonly selectedProductSupplier = signal<ProductSupplier | null>(null);

  readonly canModify = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'Administrator' || role === 'Manager';
  });

  readonly productTotalPages = computed(() => Math.ceil(this.productTotal() / this.productPageSize()));

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
        'Supplier price must be less than 999999.99': 'El precio del proveedor debe ser menor que 999999.99.',
        'Supplier price must have maximum 2 decimal places': 'El precio del proveedor debe tener maximo 2 decimales.',
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
    this.selectedProductSupplier.set(null);
    this.addSupplierDialogVisible.set(true);
  }

  closeAddSupplierDialog(): void {
    this.addSupplierDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
  }

  async addSupplierToProduct(request: { supplierId: number; supplierPrice: number }): Promise<void> {
    this.error.set(null);

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    if (!currentProductId) {
      return;
    }

    this.loading.set(true);
    try {
      const addRequest: AddSupplierProductRequest = {
        productId: currentProductId,
        supplierPrice: request.supplierPrice,
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
    this.selectedProductSupplier.set(productSupplier);
    this.editSupplierPriceDialogVisible.set(true);
  }

  closeEditSupplierPriceDialog(): void {
    this.editSupplierPriceDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
  }

  async updateSupplierPrice(request: UpdateSupplierProductPriceRequest): Promise<void> {
    this.error.set(null);

    const currentProductId = this.requireProductId('No hay producto seleccionado.');
    const currentProductSupplier = this.requireSelectedProductSupplier('No hay proveedor seleccionado.');
    if (!currentProductId || !currentProductSupplier) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.updateSupplierProductPriceUseCase.execute(
          currentProductSupplier.supplierId,
          currentProductId,
          request,
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
    this.selectedProductSupplier.set(productSupplier);
    this.confirmDeleteSupplierDialogVisible.set(true);
  }

  cancelDeleteSupplier(): void {
    this.confirmDeleteSupplierDialogVisible.set(false);
    this.selectedProductSupplier.set(null);
  }

  async confirmDeleteSupplier(): Promise<void> {
    this.error.set(null);

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
