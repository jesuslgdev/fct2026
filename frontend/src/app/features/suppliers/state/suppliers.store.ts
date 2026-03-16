import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '@domain/models/provider.model';
import { ProviderProduct } from '@domain/models/provider-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetProvidersUseCase } from '@domain/usecases/supplier/get-providers.usecase';
import { GetProviderByIdUseCase } from '@domain/usecases/supplier/get-provider-by-id.usecase';
import { CreateProviderUseCase } from '@domain/usecases/supplier/create-provider.usecase';
import { UpdateProviderUseCase } from '@domain/usecases/supplier/update-provider.usecase';
import { ActivateProviderUseCase } from '@domain/usecases/supplier/activate-provider.usecase';
import { DeactivateProviderUseCase } from '@domain/usecases/supplier/deactivate-provider.usecase';
import { GetProviderProductsUseCase } from '@domain/usecases/supplier/get-provider-products.usecase';

export type DialogMode = 'create' | 'edit';

@Injectable()
export class SuppliersStore {
  // ── Injection ──────────────────────────────────────────────────────────
  private readonly authService = inject(AuthService);

  // Use cases are injected with inject() - NEVER use new
  private readonly getProvidersUseCase = inject(GetProvidersUseCase);
  private readonly getProviderByIdUseCase = inject(GetProviderByIdUseCase);
  private readonly createProviderUseCase = inject(CreateProviderUseCase);
  private readonly updateProviderUseCase = inject(UpdateProviderUseCase);
  private readonly activateProviderUseCase = inject(ActivateProviderUseCase);
  private readonly deactivateProviderUseCase = inject(DeactivateProviderUseCase);
  private readonly getProviderProductsUseCase = inject(GetProviderProductsUseCase);

  // ── State (signals) ────────────────────────────────────────────────────
  readonly providers = signal<Provider[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly providerProducts = signal<ProviderProduct[]>([]);

  // Filters
  readonly searchQuery = signal('');
  readonly statusFilter = signal<ProviderStatus | null>(null);

  // Dialog state
  readonly selectedProvider = signal<Provider | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly providerToToggle = signal<Provider | null>(null);
  readonly productsDialogVisible = signal(false);
  readonly selectedProviderForProducts = signal<Provider | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────
  readonly canEdit = computed(() => {
    const userRole = this.authService.user()?.role;
    return userRole === UserRole.ADMIN || userRole === UserRole.PURCHASES_MANAGER;
  });

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Enriched view with products
  readonly providersView = computed(() =>
    this.providers().map((provider) => ({
      ...provider,
      productCount: this.providerProducts().filter((p) => p.providerId === provider.id).length,
    })),
  );

  // Filtered providers for UI (display only, not for pagination)
  readonly filteredProviders = computed(() => {
    // In lazy mode, data comes filtered from server
    // Only apply local filters if not in lazy mode or for quick search
    if (this.searchQuery() || this.statusFilter()) {
      let filtered = [...this.providers()];
      
      // Search filter (if backend doesn't support it)
      const search = this.searchQuery().toLowerCase();
      if (search) {
        filtered = filtered.filter(
          (provider) =>
            provider.name.toLowerCase().includes(search) ||
            provider.email.toLowerCase().includes(search) ||
            provider.taxId.toLowerCase().includes(search) ||
            (provider.contactPerson?.toLowerCase().includes(search) ?? false),
        );
      }

      // Status filter (if backend doesn't support it)
      const statusFilter = this.statusFilter();
      if (statusFilter) {
        filtered = filtered.filter((provider) => provider.status === statusFilter);
      }

      return filtered;
    }
    
    // If no local filters, return server data
    return this.providers();
  });

  // ── Error mapping (Domain → UI messages) ───────────────────────────────────
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
        return 'The selected provider no longer exists.';
      }
      return err.message || fallback;
    }
    return fallback;
  }

  // ── Data loading actions ─────────────────────────────────────────────
  async loadProviders(pageEvent?: PageEvent): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.getProvidersUseCase.execute(pageEvent);
      this.providers.set(result.data);
      this.total.set(result.total);

      // Update pagination if comes from event
      if (pageEvent?.page !== undefined) {
        this.page.set(pageEvent.page);
      }
      if (pageEvent?.rows !== undefined) {
        this.pageSize.set(pageEvent.rows);
      }
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load providers.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadProviderById(id: string): Promise<Provider | null> {
    try {
      const provider = await this.getProviderByIdUseCase.execute(id);
      return provider;
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load provider.'));
      return null;
    }
  }

  async loadProviderProducts(providerId: string): Promise<void> {
    try {
      const result = await this.getProviderProductsUseCase.execute(providerId);
      if (result.length > 0 && result[0].products) {
        this.providerProducts.set(result[0].products);
      }
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load provider products.'));
    }
  }

  // ── Dialog actions ───────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedProvider.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  async openEditDialog(provider: Provider): Promise<void> {
    // Load complete details from backend before opening dialog
    this.loading.set(true);
    try {
      const fullProvider = await this.loadProviderById(provider.id);
      if (fullProvider) {
        this.selectedProvider.set(fullProvider);
        this.dialogMode.set('edit');
        this.dialogVisible.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedProvider.set(null);
  }

  openProductsDialog(provider: Provider): void {
    this.selectedProviderForProducts.set(provider);
    this.productsDialogVisible.set(true);
    this.loadProviderProducts(provider.id);
  }

  closeProductsDialog(): void {
    this.productsDialogVisible.set(false);
    this.selectedProviderForProducts.set(null);
    this.providerProducts.set([]);
  }

  requestToggleStatus(provider: Provider): void {
    this.providerToToggle.set(provider);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.providerToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }

  // ── CRUD actions ───────────────────────────────────────────────────────
  async saveProvider(payload: CreateProviderRequest | UpdateProviderRequest): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedProvider()) {
        // Update: replace in local array
        const updated = await this.updateProviderUseCase.execute(
          this.selectedProvider()!.id,
          payload as UpdateProviderRequest,
        );
        this.providers.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // Create: add to end of local array (like in users.store.ts)
        const created = await this.createProviderUseCase.execute(payload as CreateProviderRequest);
        this.providers.update((list) => [...list, created]);
        this.total.update((t) => t + 1);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save provider.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmToggleStatus(): Promise<void> {
    const provider = this.providerToToggle();
    if (!provider) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      if (provider.isActive) {
        await this.deactivateProviderUseCase.execute(provider.id);
      } else {
        await this.activateProviderUseCase.execute(provider.id);
      }

      // Optimistic local update (like in users.store.ts)
      this.providers.update((list) =>
        list.map((p) =>
          p.id === provider.id
            ? { ...p, isActive: !p.isActive, status: p.isActive ? ProviderStatus.INACTIVE : ProviderStatus.ACTIVE }
            : p,
        ),
      );

      this.confirmDialogVisible.set(false);
      this.providerToToggle.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to update provider status.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Filters and pagination ───────────────────────────────────────────────────
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1); // Reset to first page
    this.loadProviders();
  }

  onStatusFilterChange(status: ProviderStatus | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadProviders();
  }

  onPageChange(event: PageEvent): void {
    // PrimeNG pagination emits `first` (offset 0-based) and `rows`, and optionally `page`.
    // Backend only needs page and page_size, not first.
    const rows = event.rows ?? this.pageSize();
    let page: number;
    
    if (event.page !== undefined) {
      // PrimeNG emits `page` as 0-based index; convert to 1-based.
      page = event.page + 1;
    } else {
      // Calculate from first offset (convert 0-based to 1-based)
      page = Math.floor((event.first ?? 0) / rows) + 1;
    }
    
    // Create PageEvent with only parameters backend needs
    const updatedPageEvent: PageEvent = {
      page,
      rows
    };
    
    this.page.set(page);
    this.pageSize.set(rows);
    
    // Load data from server with new pagination
    this.loadProviders(updatedPageEvent);
  }

  // ── Utilities ───────────────────────────────────────────────────────────
  clearError(): void {
    this.error.set(null);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(null);
    this.page.set(1);
    this.loadProviders();
  }
}
