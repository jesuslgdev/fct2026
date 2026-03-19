import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  ProductCategory,
} from '@domain/models/product.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { CreateProductUseCase } from '@domain/usecases/product/create-product.usecase';
import { UpdateProductUseCase } from '@domain/usecases/product/update-product.usecase';
import { ToggleProductStatusUseCase } from '@domain/usecases/product/toggle-product-status.usecase';
import { GetProductByIdUseCase } from '@domain/usecases/product/get-product-by-id.usecase';
import { CheckProductCodeUseCase } from '@domain/usecases/product/check-product-code.usecase';
import { GetLowStockProductsUseCase } from '@domain/usecases/product/get-low-stock-products.usecase';
import { GetProductCategoriesUseCase } from '@domain/usecases/product/get-product-categories.usecase';
import {
  ProductApiError,
  ProductForbiddenError,
  ProductNotFoundError,
  ProductUnauthorizedError,
  ProductValidationError,
} from '@domain/models/product-errors';

export type DialogMode = 'create' | 'edit' | 'view';

@Injectable()
export class ProductsStore {
  private readonly authService = inject(AuthService);
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly createProductUseCase = inject(CreateProductUseCase);
  private readonly updateProductUseCase = inject(UpdateProductUseCase);
  private readonly toggleProductStatusUseCase = inject(ToggleProductStatusUseCase);
  private readonly getProductByIdUseCase = inject(GetProductByIdUseCase);
  private readonly checkProductCodeUseCase = inject(CheckProductCodeUseCase);
  private readonly getLowStockProductsUseCase = inject(GetLowStockProductsUseCase);
  private readonly getProductCategoriesUseCase = inject(GetProductCategoriesUseCase);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly categoryFilter = signal<number | null>(null);
  readonly statusFilter = signal<boolean | null>(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly productToToggle = signal<Product | null>(null);
  readonly categories = signal<ProductCategory[]>([]);
  readonly lowStockProducts = signal<Product[]>([]);
  readonly codeValidationLoading = signal(false);
  readonly codeValidationError = signal<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly canEdit = computed(() => {
    const user = this.authService.user();
    return user?.role === 'Administrator' || user?.role === 'Manager';
  });

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  
  // Computed view for table - allows wrapping/enriching data without triggering pagination
  readonly productsView = computed(() => {
    return this.products().map(product => ({
      ...product,
      isLowStock: product.stock < product.minStock,
      statusClass: product.isActive ? 'active' : 'inactive',
    }));
  });

  readonly hasLowStockProducts = computed(() => this.lowStockProducts().length > 0);

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof ProductValidationError) {
      return err.message || 'Please check the submitted data.';
    }

    if (err instanceof ProductUnauthorizedError) {
      return 'Your session has expired. Please sign in again.';
    }

    if (err instanceof ProductForbiddenError) {
      return 'You do not have permissions to perform this action.';
    }

    if (err instanceof ProductNotFoundError) {
      return 'The selected product no longer exists.';
    }

    if (err instanceof ProductApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  // ── Data Loading ────────────────────────────────────────────────────────────
  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const params: ProductQueryParams = {
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        categoryId: this.categoryFilter() || undefined,
        active: this.statusFilter() ?? undefined,
      };

      const result = await this.getProductsUseCase.execute(params);
      this.products.set(result.data);
      this.total.set(result.total);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load products.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.getProductCategoriesUseCase.execute();
      this.categories.set(categories);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load categories.'));
    }
  }

  async loadLowStockProducts(): Promise<void> {
    try {
      const products = await this.getLowStockProductsUseCase.execute();
      this.lowStockProducts.set(products);
    } catch {
      console.error('Failed to load low stock products');
    }
  }

  // ── CRUD Actions ────────────────────────────────────────────────────────────
  async createProduct(payload: CreateProductPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.createProductUseCase.execute(payload);
      await this.loadProducts(); // Reload to get updated list
      this.closeDialog();
    } catch {
      this.error.set('Failed to create product.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateProduct(productId: number, payload: UpdateProductPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.updateProductUseCase.execute(productId, payload);
      await this.loadProducts(); // Reload to get updated list
      this.closeDialog();
    } catch {
      this.error.set('Failed to update product.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleProductStatus(product: Product): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.toggleProductStatusUseCase.execute(product.productId, !product.isActive);
      await this.loadProducts(); // Reload to get updated list
      this.closeConfirmDialog();
    } catch {
      this.error.set('Failed to update product status.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadProductById(productId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const product = await this.getProductByIdUseCase.execute(productId);
      this.selectedProduct.set(product);
    } catch {
      this.error.set('Failed to load product details.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  async validateProductCode(code: string): Promise<void> {
    if (!code || code.trim().length === 0) {
      this.codeValidationError.set(null);
      return;
    }

    this.codeValidationLoading.set(true);
    this.codeValidationError.set(null);

    try {
      const exists = await this.checkProductCodeUseCase.execute(code.trim());
      if (exists) {
        this.codeValidationError.set('Product code already exists');
      }
    } catch {
      this.codeValidationError.set('Failed to validate product code');
    } finally {
      this.codeValidationLoading.set(false);
    }
  }

  // ── Dialog Actions ──────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedProduct.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
    this.codeValidationError.set(null);
  }

  async openEditDialog(productId: number): Promise<void> {
    await this.loadProductById(productId);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
    this.codeValidationError.set(null);
  }

  openViewDialog(productId: number): void {
    this.loadProductById(productId);
    this.dialogMode.set('view');
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedProduct.set(null);
    this.codeValidationError.set(null);
  }

  openConfirmDialog(product: Product): void {
    this.productToToggle.set(product);
    this.confirmDialogVisible.set(true);
  }

  closeConfirmDialog(): void {
    this.confirmDialogVisible.set(false);
    this.productToToggle.set(null);
  }

  // ── Filters and Pagination ────────────────────────────────────────────────
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1); // Reset to first page when searching
  }

  setCategoryFilter(categoryId: number | null): void {
    this.categoryFilter.set(categoryId);
    this.page.set(1); // Reset to first page when filtering
  }

  setStatusFilter(status: boolean | null): void {
    this.statusFilter.set(status);
    this.page.set(1); // Reset to first page when filtering
  }

  async onPageChange(newPage: number): Promise<void> {
    this.page.set(newPage);
    await this.loadProducts();
  }

  async onPageSizeChange(newPageSize: number): Promise<void> {
    this.pageSize.set(newPageSize);
    this.page.set(1); // Reset to first page when changing page size
    await this.loadProducts();
  }

  // ── Utilities ───────────────────────────────────────────────────────────────
  async refresh(): Promise<void> {
    await this.loadProducts();
    await this.loadLowStockProducts();
  }

  clearError(): void {
    this.error.set(null);
  }
}
