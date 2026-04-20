import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { Product } from '@domain/models/product.model';
import {
  AddSupplierProductRequest,
  DownloadSupplierProductTemplateRequest,
  ImportResult,
  SupplierProduct,
  SupplierProductQueryParams,
} from '@domain/models/supplier-product.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
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
  private readonly importSupplierProductsUseCase = inject(ImportSupplierProductsUseCase);
  private readonly downloadTemplateUseCase = inject(DownloadTemplateUseCase);
  private readonly getProductsUseCase = inject(GetProductsUseCase);

  readonly supplierProducts = signal<SupplierProduct[]>([]);
  readonly supplierId = signal<number | null>(null);
  readonly supplierTotal = signal(0);
  readonly supplierPage = signal(1);
  readonly supplierPageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly addProductDialogError = signal<string | null>(null);
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
  readonly importDialogVisible = signal(false);
  readonly selectedImportFile = signal<File | null>(null);
  readonly importResult = signal<ImportResult | null>(null);
  readonly importLoading = signal(false);
  readonly importDialogError = signal<string | null>(null);
  readonly templateProducts = signal<Product[]>([]);
  readonly templateProductsTotal = signal(0);
  readonly templateProductsPage = signal(1);
  readonly templateProductsPageSize = signal(10);
  readonly templateProductsSearchQuery = signal('');
  readonly templateProductsLoading = signal(false);
  readonly templateDownloadLoading = signal(false);
  readonly selectedTemplateProductIds = signal<ReadonlySet<number>>(new Set<number>());

  readonly canModify = computed(() =>
    this.authService.hasPermission([UserPermission.Admin, UserPermission.PurchasesManager])
  );
  readonly supplierTotalPages = computed(() => Math.ceil(this.supplierTotal() / this.supplierPageSize()));
  readonly associatedSupplierProductIds = computed(() =>
    new Set(this.supplierProducts().map((item) => item.productId))
  );
  readonly activeProductsForAdd = computed(() => {
    const associated = this.associatedSupplierProductIds();
    return this.activeProducts().filter((product) => product.isActive && !associated.has(product.productId));
  });
  readonly visibleSelectableTemplateProducts = computed(() =>
    this.templateProducts().filter((product) => !this.associatedSupplierProductIds().has(product.productId))
  );
  readonly selectedTemplateProductCount = computed(() => this.selectedTemplateProductIds().size);
  readonly hasSelectableTemplateProductsOnPage = computed(() => this.visibleSelectableTemplateProducts().length > 0);
  readonly allVisibleTemplateProductsSelected = computed(() => {
    const visibleProducts = this.visibleSelectableTemplateProducts();
    return visibleProducts.length > 0 && visibleProducts.every((product) =>
      this.selectedTemplateProductIds().has(product.productId)
    );
  });
  readonly someVisibleTemplateProductsSelected = computed(() => {
    const visibleProducts = this.visibleSelectableTemplateProducts();
    if (visibleProducts.length === 0) {
      return false;
    }

    const hasAnySelected = visibleProducts.some((product) =>
      this.selectedTemplateProductIds().has(product.productId)
    );

    return hasAnySelected && !this.allVisibleTemplateProductsSelected();
  });
  readonly importInvalidRows = computed(() => {
    const result = this.importResult();
    return result ? new Set(result.errorDetail.map((error) => error.row)).size : 0;
  });
  readonly importValidRows = computed(() => {
    const result = this.importResult();
    return result ? Math.max(result.total - this.importInvalidRows(), 0) : 0;
  });
  readonly importHasErrors = computed(() => (this.importResult()?.errors ?? 0) > 0);
  readonly importSucceeded = computed(() => {
    const result = this.importResult();
    return !!result && result.errors === 0;
  });

  private buildQueryParams(): SupplierProductQueryParams {
    return { page: this.supplierPage(), pageSize: this.supplierPageSize() };
  }

  private buildTemplateProductsQueryParams(): {
    page: number;
    pageSize: number;
    search?: string;
    active: boolean;
  } {
    const search = this.templateProductsSearchQuery().trim();

    return {
      page: this.templateProductsPage(),
      pageSize: this.templateProductsPageSize(),
      ...(search ? { search } : {}),
      active: true,
    };
  }

  private resetImportDialogState(): void {
    this.selectedImportFile.set(null);
    this.importResult.set(null);
    this.importDialogError.set(null);
    this.templateProducts.set([]);
    this.templateProductsTotal.set(0);
    this.templateProductsPage.set(1);
    this.templateProductsPageSize.set(10);
    this.templateProductsSearchQuery.set('');
    this.templateProductsLoading.set(false);
    this.templateDownloadLoading.set(false);
    this.selectedTemplateProductIds.set(new Set<number>());
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

  private translateImportErrorReason(reason: string): string {
    const exactTranslations: Record<string, string> = {
      'Invalid or corrupted file': 'Archivo invalido o corrupto.',
      'File is empty or has no data rows': 'El archivo esta vacio o no contiene filas de datos.',
      'Invalid headers. Use the provided template': 'Cabeceras invalidas. Usa la plantilla proporcionada.',
      'Product code is required': 'El codigo de producto es obligatorio.',
      'Price is required': 'El precio es obligatorio.',
      'Price must be greater than zero': 'El precio debe ser mayor que cero.',
      'Price cannot have more than 2 decimal places': 'El precio no puede tener mas de 2 decimales.',
      'Invalid price format': 'Formato de precio invalido.',
    };

    const exactTranslation = exactTranslations[reason];
    if (exactTranslation) {
      return exactTranslation;
    }

    const productNotFound = reason.match(/^Product with code (.+) not found$/);
    if (productNotFound?.[1]) {
      return `Producto con codigo ${productNotFound[1]} no encontrado.`;
    }

    const productInactive = reason.match(/^Product (.+) is not active$/);
    if (productInactive?.[1]) {
      return `El producto ${productInactive[1]} no esta activo.`;
    }

    const associationExists = reason.match(/^Association already exists for product (.+)$/);
    if (associationExists?.[1]) {
      return `La asociacion ya existe para el producto ${associationExists[1]}.`;
    }

    const duplicateProductCode = reason.match(/^Duplicate product code in file: (.+)$/);
    if (duplicateProductCode?.[1]) {
      return `Codigo de producto duplicado en el archivo: ${duplicateProductCode[1]}.`;
    }

    return reason;
  }

  private translateImportResult(result: ImportResult): ImportResult {
    return {
      ...result,
      errorDetail: result.errorDetail.map((error) => ({
        ...error,
        reason: this.translateImportErrorReason(error.reason),
      })),
    };
  }

  private setAddProductDialogError(message: string): void {
    this.addProductDialogError.set(message);
    this.addProductDialogVisible.set(true);
  }

  private ensureCanModify(setError: (message: string) => void = (message) => this.error.set(message)): boolean {
    if (this.canModify()) return true;
    setError('No tiene permisos para realizar esta accion.');
    return false;
  }

  private requireSupplierId(setError: (message: string) => void = (message) => this.error.set(message)): number | null {
    const currentSupplierId = this.supplierId();
    if (!currentSupplierId) setError('No hay proveedor seleccionado.');
    return currentSupplierId;
  }

  private parseSupplierPrice(
    value: number | string,
    setError: (message: string) => void = (message) => this.error.set(message),
  ): number | null {
    const normalized = value.toString().trim().replace(',', '.');
    const price = Number(normalized);
    if (!Number.isFinite(price) || price <= 0) {
      setError('El precio del proveedor debe ser mayor que cero.');
      return null;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      setError('El precio del proveedor debe tener maximo 2 decimales.');
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
      this.setAddProductDialogError(this.resolveErrorMessage(err, 'Error al cargar productos activos.'));
    } finally {
      this.productsLoading.set(false);
    }
  }

  async loadTemplateProducts(): Promise<void> {
    this.templateProductsLoading.set(true);
    this.importDialogError.set(null);
    try {
      const result = await firstValueFrom(this.getProductsUseCase.execute(this.buildTemplateProductsQueryParams()));
      this.templateProducts.set(result.data.filter((product) => product.isActive));
      this.templateProductsTotal.set(result.total);
      this.templateProductsPage.set(result.page);
      this.templateProductsPageSize.set(result.pageSize);
    } catch (err) {
      this.importDialogError.set(this.resolveErrorMessage(err, 'Error al cargar productos del catalogo.'));
    } finally {
      this.templateProductsLoading.set(false);
    }
  }

  openAddProductDialog(): void {
    if (!this.ensureCanModify()) return;
    this.selectedProductId.set(null);
    this.addProductPriceDraft.set('');
    this.addProductDialogError.set(null);
    this.addProductDialogVisible.set(true);
    void this.loadActiveProductsForAdd();
  }

  closeAddProductDialog(): void {
    this.addProductDialogVisible.set(false);
    this.selectedProductId.set(null);
    this.addProductPriceDraft.set('');
    this.addProductDialogError.set(null);
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
      this.setAddProductDialogError('Producto seleccionado invalido.');
      return;
    }
    await this.addProductToSupplier({ productId, supplierPrice: this.addProductPriceDraft() });
  }

  async addProductToSupplier(request: { productId: number; supplierPrice: number | string }): Promise<void> {
    this.addProductDialogError.set(null);
    const setDialogError = (message: string) => this.setAddProductDialogError(message);
    if (!this.ensureCanModify(setDialogError)) return;
    const supplierId = this.requireSupplierId(setDialogError);
    const supplierPrice = this.parseSupplierPrice(request.supplierPrice, setDialogError);
    if (!supplierId || supplierPrice === null) return;
    this.loading.set(true);
    try {
      const addRequest: AddSupplierProductRequest = { productId: request.productId, supplierPrice };
      await firstValueFrom(this.addProductToSupplierUseCase.execute(supplierId, addRequest));
      this.closeAddProductDialog();
      await this.fetchSupplierProducts(supplierId);
    } catch (err) {
      this.setAddProductDialogError(this.resolveErrorMessage(err, 'Error al agregar producto al proveedor.'));
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

  openImportDialog(): void {
    if (!this.ensureCanModify()) return;
    this.importDialogVisible.set(true);
    this.resetImportDialogState();
    void this.loadTemplateProducts();
  }

  closeImportDialog(): void {
    this.importDialogVisible.set(false);
    this.resetImportDialogState();
  }

  setImportFile(file: File | null): void {
    this.importDialogError.set(null);
    this.importResult.set(null);
    this.selectedImportFile.set(file);
  }

  onTemplateProductsSearch(query: string): void {
    this.templateProductsSearchQuery.set(query.trim());
    this.templateProductsPage.set(1);
    void this.loadTemplateProducts();
  }

  onTemplateProductsPageChange(event: { first: number; rows: number }): void {
    this.templateProductsPage.set(Math.floor(event.first / event.rows) + 1);
    this.templateProductsPageSize.set(event.rows);
    void this.loadTemplateProducts();
  }

  isProductAlreadyAssociated(productId: number): boolean {
    return this.associatedSupplierProductIds().has(productId);
  }

  isTemplateProductSelected(productId: number): boolean {
    return this.selectedTemplateProductIds().has(productId);
  }

  setTemplateProductSelected(productId: number, selected: boolean): void {
    if (this.isProductAlreadyAssociated(productId)) {
      return;
    }

    this.selectedTemplateProductIds.update((ids) => {
      const next = new Set(ids);

      if (selected) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      return next;
    });
  }

  toggleAllVisibleTemplateProducts(selected: boolean): void {
    this.selectedTemplateProductIds.update((ids) => {
      const next = new Set(ids);

      for (const product of this.visibleSelectableTemplateProducts()) {
        if (selected) {
          next.add(product.productId);
        } else {
          next.delete(product.productId);
        }
      }

      return next;
    });
  }

  clearTemplateSelection(): void {
    this.selectedTemplateProductIds.set(new Set<number>());
  }

  async importSupplierProducts(): Promise<void> {
    this.importDialogError.set(null);
    if (!this.ensureCanModify((message) => this.importDialogError.set(message))) return;
    const supplierId = this.requireSupplierId((message) => this.importDialogError.set(message));
    const file = this.selectedImportFile();
    if (!supplierId || !file) {
      this.importDialogError.set('Se requiere archivo Excel para importar.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.importDialogError.set('El archivo debe ser Excel .xlsx.');
      return;
    }
    this.importLoading.set(true);
    try {
      const result = await firstValueFrom(this.importSupplierProductsUseCase.execute(supplierId, { file }));
      this.importResult.set(this.translateImportResult(result));
      if (result.errors === 0) {
        await this.fetchSupplierProducts(supplierId);
        this.clearTemplateSelection();
        await this.loadTemplateProducts();
      }
    } catch (err) {
      this.importDialogError.set(this.resolveErrorMessage(err, 'Error al importar productos del proveedor.'));
    } finally {
      this.importLoading.set(false);
    }
  }

  async downloadTemplate(): Promise<Blob | null> {
    const supplierId = this.requireSupplierId((message) => this.importDialogError.set(message));
    if (!supplierId) return null;

    const productIds = Array.from(this.selectedTemplateProductIds()).filter(
      (productId) => !this.isProductAlreadyAssociated(productId)
    );
    const request: DownloadSupplierProductTemplateRequest | undefined = productIds.length > 0
      ? { productIds }
      : undefined;

    this.templateDownloadLoading.set(true);
    this.importDialogError.set(null);

    try {
      return await firstValueFrom(this.downloadTemplateUseCase.execute(supplierId, request));
    } catch (err) {
      this.importDialogError.set(this.resolveErrorMessage(err, 'Error al descargar plantilla.'));
      return null;
    } finally {
      this.templateDownloadLoading.set(false);
    }
  }

}
