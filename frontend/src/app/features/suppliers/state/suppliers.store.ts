import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@domain/models/supplier.model';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetSuppliersUseCase } from '@domain/usecases/supplier/get-suppliers.usecase';
import { GetSupplierByIdUseCase } from '@domain/usecases/supplier/get-supplier-by-id.usecase';
import { CreateSupplierUseCase } from '@domain/usecases/supplier/create-supplier.usecase';
import { UpdateSupplierUseCase } from '@domain/usecases/supplier/update-supplier.usecase';
import { ActivateSupplierUseCase } from '@domain/usecases/supplier/activate-supplier.usecase';
import { DeactivateSupplierUseCase } from '@domain/usecases/supplier/deactivate-supplier.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier/get-supplier-products.usecase';

export type DialogMode = 'create' | 'edit';

@Injectable()
export class SuppliersStore {
  // Injection
  private readonly authService = inject(AuthService);

  // Use cases are injected with inject() - NEVER use new
  private readonly getSuppliersUseCase = inject(GetSuppliersUseCase);
  private readonly getSupplierByIdUseCase = inject(GetSupplierByIdUseCase);
  private readonly createSupplierUseCase = inject(CreateSupplierUseCase);
  private readonly updateSupplierUseCase = inject(UpdateSupplierUseCase);
  private readonly activateSupplierUseCase = inject(ActivateSupplierUseCase);
  private readonly deactivateSupplierUseCase = inject(DeactivateSupplierUseCase);
  private readonly getSupplierProductsUseCase = inject(GetSupplierProductsUseCase);

  // State (signals)
  readonly suppliers = signal<Supplier[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly supplierProducts = signal<SupplierProduct[]>([]);

  // Filters
  readonly searchQuery = signal('');
  readonly statusFilter = signal<SupplierStatus | null>(null);

  // Dialog state
  readonly selectedSupplier = signal<Supplier | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly supplierToToggle = signal<Supplier | null>(null);
  readonly productsDialogVisible = signal(false);
  readonly selectedSupplierForProducts = signal<Supplier | null>(null);

  // Computed
  readonly canEdit = computed(() => {
    const userRole = this.authService.user()?.role;
    return userRole === UserRole.Administrator || userRole === UserRole.Manager;
  });

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Enriched view with products
  readonly suppliersView = computed(() =>
    this.suppliers().map((supplier) => ({
      ...supplier,
      productCount: this.supplierProducts().filter((p) => p.supplierId === supplier.id).length,
    })),
  );

  // Table data comes already filtered from backend when lazy mode is enabled.
  readonly filteredSuppliers = computed(() => this.suppliers());

  private buildSuppliersPageEvent(pageEvent?: PageEvent): PageEvent {
    const rows = pageEvent?.rows ?? this.pageSize();
    const page = pageEvent?.page ?? this.page();
    const first = pageEvent?.first ?? Math.max((page - 1) * rows, 0);
    const query = this.searchQuery().trim();
    const status = this.statusFilter();

    return {
      ...pageEvent,
      page,
      rows,
      first,
      ...(query ? { query } : {}),
      ...(status
        ? {
            status,
            isActive: status === SupplierStatus.ACTIVE,
          }
        : {}),
    };
  }

  // Error mapping (Domain -> UI messages)
  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) {
      // For generic backend errors
      if (err.message.includes('Validation failed')) {
        return err.message || 'Please check the submitted data.';
      }
      if (err.message.includes('Authentication required')) {
        return 'Your session has expired. Please sign in again.';
      }
      if (err.message.includes('Insufficient permissions')) {
        return 'You do not have permissions to perform this action.';
      }
      if (err.message.includes('not found')) {
        return 'The selected supplier no longer exists.';
      }
      return err.message || fallback;
    }
    return fallback;
  }

  // Data loading actions
  async loadSuppliers(pageEvent?: PageEvent): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const request = this.buildSuppliersPageEvent(pageEvent);
      const result = await this.getSuppliersUseCase.execute(request);
      this.suppliers.set(result.data);
      this.total.set(result.total);

      // Update pagination if comes from event
      if (request.page !== undefined) {
        this.page.set(request.page);
      }
      if (request.rows !== undefined) {
        this.pageSize.set(request.rows);
      }
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load suppliers.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadSupplierById(id: string): Promise<Supplier | null> {
    try {
      const supplier = await this.getSupplierByIdUseCase.execute(id);
      return supplier;
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load supplier.'));
      return null;
    }
  }

  async loadSupplierProducts(supplierId: string): Promise<void> {
    try {
      const result = await this.getSupplierProductsUseCase.execute(supplierId);
      this.supplierProducts.set(result);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load supplier products.'));
    }
  }

  // Dialog actions
  openCreateDialog(): void {
    this.formError.set(null);
    this.selectedSupplier.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  async openEditDialog(supplier: Supplier): Promise<void> {
    // Load complete details from backend before opening dialog
    this.loading.set(true);
    this.formError.set(null);
    try {
      const fullSupplier = await this.loadSupplierById(supplier.id);
      if (fullSupplier) {
        this.selectedSupplier.set(fullSupplier);
        this.dialogMode.set('edit');
        this.dialogVisible.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedSupplier.set(null);
    this.formError.set(null);
  }

  openProductsDialog(supplier: Supplier): void {
    this.selectedSupplierForProducts.set(supplier);
    this.productsDialogVisible.set(true);
    this.loadSupplierProducts(supplier.id);
  }

  closeProductsDialog(): void {
    this.productsDialogVisible.set(false);
    this.selectedSupplierForProducts.set(null);
    this.supplierProducts.set([]);
  }

  requestToggleStatus(supplier: Supplier): void {
    this.supplierToToggle.set(supplier);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.supplierToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }

  // CRUD actions
  async saveSupplier(payload: CreateSupplierRequest | UpdateSupplierRequest): Promise<void> {
    this.loading.set(true);
    this.formError.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedSupplier()) {
        // Update: replace in local array
        const updated = await this.updateSupplierUseCase.execute(
          this.selectedSupplier()!.id,
          payload as UpdateSupplierRequest,
        );
        this.suppliers.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // Create: add to end of local array (like in users.store.ts)
        const created = await this.createSupplierUseCase.execute(payload as CreateSupplierRequest);
        this.suppliers.update((list) => [...list, created]);
        this.total.update((t) => t + 1);
      }
      this.closeDialog();
    } catch (err) {
      this.formError.set(this.resolveErrorMessage(err, 'Failed to save supplier.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmToggleStatus(): Promise<void> {
    const supplier = this.supplierToToggle();
    if (!supplier) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      if (supplier.isActive) {
        await this.deactivateSupplierUseCase.execute(supplier.id);
      } else {
        await this.activateSupplierUseCase.execute(supplier.id);
      }

      // Optimistic local update (like in users.store.ts)
      this.suppliers.update((list) =>
        list.map((p) =>
          p.id === supplier.id
            ? { ...p, isActive: !p.isActive, status: p.isActive ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE }
            : p,
        ),
      );

      this.confirmDialogVisible.set(false);
      this.supplierToToggle.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to update supplier status.'));
    } finally {
      this.loading.set(false);
    }
  }

  // Filters and pagination
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1); // Reset to first page
    this.loadSuppliers({ page: 1, rows: this.pageSize(), first: 0 });
  }

  onStatusFilterChange(status: SupplierStatus | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadSuppliers({ page: 1, rows: this.pageSize(), first: 0 });
  }

  onPageChange(event: PageEvent): void {
    // PrimeNG emits `first` and `rows`, and optionally `page` (0-based).
    // Normalize values so store state remains 1-based and backend payload is consistent.
    const rows = event.rows ?? this.pageSize();
    const pageIndex = event.page ?? Math.floor((event.first ?? 0) / rows);
    const first = event.first ?? pageIndex * rows;
    const page = pageIndex + 1;

    // Keep store page in 1-based format.
    this.page.set(page);
    this.pageSize.set(rows);
    
    // Load server data using normalized pagination values.
    this.loadSuppliers({ ...event, page, first, rows });
  }

  // Utilities
  clearError(): void {
    this.error.set(null);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(null);
    this.page.set(1);
    this.loadSuppliers({ page: 1, rows: this.pageSize(), first: 0 });
  }
}

