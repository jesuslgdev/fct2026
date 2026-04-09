import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import {
  AddSupplierProductRequest,
  ImportResult,
  ImportSupplierProductsRequest,
  SupplierProduct,
  SupplierProductQueryParams,
  UpdateSupplierProductPriceRequest,
} from '@domain/models/supplier-product.model';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { DownloadTemplateUseCase } from '@domain/usecases/supplier-product/download-template.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier-product/get-supplier-products.usecase';
import { ImportSupplierProductsUseCase } from '@domain/usecases/supplier-product/import-supplier-products.usecase';
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
export class SupplierProductsStore {
  private readonly authService = inject(AuthService);
  private readonly getSupplierProductsUseCase = inject(GetSupplierProductsUseCase);
  private readonly addProductToSupplierUseCase = inject(AddProductToSupplierUseCase);
  private readonly updateSupplierProductPriceUseCase = inject(UpdateSupplierProductPriceUseCase);
  private readonly removeProductFromSupplierUseCase = inject(RemoveProductFromSupplierUseCase);
  private readonly importSupplierProductsUseCase = inject(ImportSupplierProductsUseCase);
  private readonly downloadTemplateUseCase = inject(DownloadTemplateUseCase);

  readonly supplierProducts = signal<SupplierProduct[]>([]);
  readonly supplierId = signal<number | null>(null);
  readonly supplierTotal = signal(0);
  readonly supplierPage = signal(1);
  readonly supplierPageSize = signal(10);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly addProductDialogVisible = signal(false);
  readonly editProductPriceDialogVisible = signal(false);
  readonly confirmDeleteProductDialogVisible = signal(false);
  readonly selectedSupplierProduct = signal<SupplierProduct | null>(null);

  readonly importDialogVisible = signal(false);
  readonly importResult = signal<ImportResult | null>(null);
  readonly importing = signal(false);
  readonly downloadingTemplate = signal(false);

  readonly canModify = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'Administrator' || role === 'Manager';
  });

  readonly supplierTotalPages = computed(() => Math.ceil(this.supplierTotal() / this.supplierPageSize()));

  private buildQueryParams(): SupplierProductQueryParams {
    return {
      page: this.supplierPage(),
      pageSize: this.supplierPageSize(),
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

  private requireSupplierId(message: string): number | null {
    const currentSupplierId = this.supplierId();
    if (!currentSupplierId) {
      this.error.set(message);
      return null;
    }

    return currentSupplierId;
  }

  private requireSelectedSupplierProduct(message: string): SupplierProduct | null {
    const currentSupplierProduct = this.selectedSupplierProduct();
    if (!currentSupplierProduct) {
      this.error.set(message);
      return null;
    }

    return currentSupplierProduct;
  }

  private async fetchSupplierProducts(supplierId: number): Promise<void> {
    const result = await firstValueFrom(this.getSupplierProductsUseCase.execute(supplierId, this.buildQueryParams()));
    this.supplierProducts.set(result.data);
    this.supplierTotal.set(result.total);
  }

  private async refreshAfterMutation(supplierId: number, fallback: string): Promise<void> {
    try {
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, fallback));
    }
  }

  private triggerBlobDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
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

  openAddProductDialog(): void {
    this.selectedSupplierProduct.set(null);
    this.addProductDialogVisible.set(true);
  }

  closeAddProductDialog(): void {
    this.addProductDialogVisible.set(false);
    this.selectedSupplierProduct.set(null);
  }

  async addProductToSupplier(request: AddSupplierProductRequest): Promise<void> {
    this.error.set(null);

    const currentSupplierId = this.requireSupplierId('No hay proveedor seleccionado.');
    if (!currentSupplierId) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(this.addProductToSupplierUseCase.execute(currentSupplierId, request));
      this.closeAddProductDialog();
      await this.refreshAfterMutation(
        currentSupplierId,
        'Se agrego el producto, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al agregar producto al proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  openEditProductPriceDialog(supplierProduct: SupplierProduct): void {
    this.selectedSupplierProduct.set(supplierProduct);
    this.editProductPriceDialogVisible.set(true);
  }

  closeEditProductPriceDialog(): void {
    this.editProductPriceDialogVisible.set(false);
    this.selectedSupplierProduct.set(null);
  }

  async updatePrice(request: UpdateSupplierProductPriceRequest): Promise<void> {
    this.error.set(null);

    const currentSupplierId = this.requireSupplierId('No hay proveedor seleccionado.');
    const currentSupplierProduct = this.requireSelectedSupplierProduct('No hay producto seleccionado.');
    if (!currentSupplierId || !currentSupplierProduct) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.updateSupplierProductPriceUseCase.execute(
          currentSupplierId,
          currentSupplierProduct.productId,
          request,
        ),
      );
      this.closeEditProductPriceDialog();
      await this.refreshAfterMutation(
        currentSupplierId,
        'Se actualizo el precio, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al actualizar precio del proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  requestDeleteProduct(supplierProduct: SupplierProduct): void {
    this.selectedSupplierProduct.set(supplierProduct);
    this.confirmDeleteProductDialogVisible.set(true);
  }

  cancelDeleteProduct(): void {
    this.confirmDeleteProductDialogVisible.set(false);
    this.selectedSupplierProduct.set(null);
  }

  async confirmDelete(): Promise<void> {
    this.error.set(null);

    const currentSupplierId = this.requireSupplierId('No hay proveedor seleccionado.');
    const currentSupplierProduct = this.requireSelectedSupplierProduct('No hay producto seleccionado.');
    if (!currentSupplierId || !currentSupplierProduct) {
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.removeProductFromSupplierUseCase.execute(
          currentSupplierId,
          currentSupplierProduct.productId,
        ),
      );

      this.confirmDeleteProductDialogVisible.set(false);
      this.selectedSupplierProduct.set(null);

      await this.refreshAfterMutation(
        currentSupplierId,
        'Se elimino la asociacion, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al eliminar producto del proveedor.'));
    } finally {
      this.loading.set(false);
    }
  }

  onSupplierPageChange(event: { first: number; rows: number }): void {
    this.supplierPage.set(Math.floor(event.first / event.rows) + 1);
    this.supplierPageSize.set(event.rows);

    const currentSupplierId = this.supplierId();
    if (currentSupplierId) {
      void this.loadSupplierProducts(currentSupplierId);
    }
  }

  openImportDialog(): void {
    this.importResult.set(null);
    this.importDialogVisible.set(true);
  }

  closeImportDialog(): void {
    this.importDialogVisible.set(false);
  }

  async importProducts(request: ImportSupplierProductsRequest): Promise<void> {
    this.error.set(null);

    const currentSupplierId = this.requireSupplierId('No hay proveedor seleccionado.');
    if (!currentSupplierId) {
      return;
    }

    this.importing.set(true);
    try {
      const result = await firstValueFrom(
        this.importSupplierProductsUseCase.execute(currentSupplierId, request),
      );
      this.importResult.set(result);
      this.closeImportDialog();
      await this.refreshAfterMutation(
        currentSupplierId,
        'Se completo la importacion, pero no se pudo recargar la lista.',
      );
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al importar productos.'));
    } finally {
      this.importing.set(false);
    }
  }

  async downloadTemplate(): Promise<void> {
    this.error.set(null);

    const currentSupplierId = this.requireSupplierId('No hay proveedor seleccionado.');
    if (!currentSupplierId) {
      return;
    }

    this.downloadingTemplate.set(true);
    try {
      const blob = await firstValueFrom(this.downloadTemplateUseCase.execute(currentSupplierId));
      this.triggerBlobDownload(blob, `supplier-products-template-${currentSupplierId}.xlsx`);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Error al descargar plantilla.'));
    } finally {
      this.downloadingTemplate.set(false);
    }
  }
}
