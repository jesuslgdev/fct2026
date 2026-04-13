import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
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
  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: ProductQueryParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
      categoryId: this.categoryFilter() || undefined,
      active: this.statusFilter() ?? undefined,
    };

    this.getProductsUseCase.execute(params).pipe(
      tap(result => {
        this.products.set(result.data);
        this.total.set(result.total);
      }),
      catchError(err => {
        this.error.set(this.resolveErrorMessage(err, 'Failed to load products.'));
        return of();
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  loadCategories(): void {
    this.getProductCategoriesUseCase.execute().pipe(
      tap(categories => this.categories.set(categories)),
      catchError(err => {
        this.error.set(this.resolveErrorMessage(err, 'Failed to load categories.'));
        return of();
      })
    ).subscribe();
  }

  loadLowStockProducts(): void {
    this.getLowStockProductsUseCase.execute().pipe(
      tap(products => this.lowStockProducts.set(products)),
      catchError(() => {
        this.error.set('Failed to load low stock products.');
        return of();
      })
    ).subscribe();
  }

  // ── CRUD Actions ────────────────────────────────────────────────────────────
  createProduct(payload: CreateProductPayload): void {
    this.loading.set(true);
    this.error.set(null);

    this.createProductUseCase.execute(payload).pipe(
      tap(() => {
        this.loadProducts(); // Reload to get updated list
        this.closeDialog();
      }),
      catchError(() => {
        this.error.set('Failed to create product.');
        return of();
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  updateProduct(productId: number, payload: UpdateProductPayload): void {
    this.loading.set(true);
    this.error.set(null);

    this.updateProductUseCase.execute(productId, payload).pipe(
      tap(() => {
        this.loadProducts(); // Reload to get updated list
        this.closeDialog();
      }),
      catchError(() => {
        this.error.set('Failed to update product.');
        return of();
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  toggleProductStatus(product: Product): void {
    this.loading.set(true);
    this.error.set(null);

    this.toggleProductStatusUseCase.execute(product.productId, !product.isActive).pipe(
      tap(() => {
        this.loadProducts(); // Reload to get updated list
        this.closeConfirmDialog();
      }),
      catchError(() => {
        this.error.set('Failed to update product status.');
        return of();
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  loadProductById(productId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.getProductByIdUseCase.execute(productId).pipe(
      tap(product => this.selectedProduct.set(product)),
      catchError(() => {
        this.error.set('Failed to load product details.');
        return of();
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  validateProductCode(code: string): void {
    if (!code || code.trim().length === 0) {
      this.codeValidationError.set(null);
      return;
    }

    this.codeValidationLoading.set(true);
    this.codeValidationError.set(null);

    this.checkProductCodeUseCase.execute(code.trim()).pipe(
      tap(exists => {
        if (exists) {
          this.codeValidationError.set('Product code already exists');
        }
      }),
      catchError(() => {
        this.codeValidationError.set('Failed to validate product code');
        return of();
      }),
      finalize(() => this.codeValidationLoading.set(false))
    ).subscribe();
  }

  // ── Dialog Actions ──────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedProduct.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
    this.codeValidationError.set(null);
  }

  openEditDialog(productId: number): void {
    this.loadProductById(productId);
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

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadProducts();
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize.set(newPageSize);
    this.page.set(1); // Reset to first page when changing page size
    this.loadProducts();
  }

  // ── Utilities ───────────────────────────────────────────────────────────────
  refresh(): void {
    this.loadProducts();
    this.loadLowStockProducts();
  }

  clearError(): void {
    this.error.set(null);
  }
}
