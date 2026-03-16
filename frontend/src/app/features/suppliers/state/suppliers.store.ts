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
  // ── Inyección ──────────────────────────────────────────────────────────
  private readonly authService = inject(AuthService);

  // Use cases se inyectan con inject() — NUNCA usar new
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

  // Filtros
  readonly searchQuery = signal('');
  readonly statusFilter = signal<ProviderStatus | null>(null);

  // Estado de diálogos
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

  // Vista enriquecida con productos
  readonly providersView = computed(() =>
    this.providers().map((provider) => ({
      ...provider,
      productCount: this.providerProducts().filter((p) => p.providerId === provider.id).length,
    })),
  );

  // Proveedores filtrados para UI
  readonly filteredProviders = computed(() => {
    let filtered = [...this.providers()];

    // Filtro por búsqueda
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

    // Filtro por estado
    const statusFilter = this.statusFilter();
    if (statusFilter) {
      filtered = filtered.filter((provider) => provider.status === statusFilter);
    }

    return filtered;
  });

  // ── Error mapping (Domain → UI messages) ───────────────────────────────────
  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) {
      // Para errores genéricos del backend
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

  // ── Acciones de carga de datos ─────────────────────────────────────────────
  async loadProviders(pageEvent?: PageEvent): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.getProvidersUseCase.execute(pageEvent);
      this.providers.set(result.data);
      this.total.set(result.total);

      // Actualizar paginación si viene del evento
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

  // ── Acciones de diálogos ───────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedProvider.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEditDialog(provider: Provider): void {
    this.selectedProvider.set(provider);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
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

  // ── Acciones CRUD ───────────────────────────────────────────────────────
  async saveProvider(payload: CreateProviderRequest | UpdateProviderRequest): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedProvider()) {
        // Actualizar: reemplazar en el array local
        const updated = await this.updateProviderUseCase.execute(
          this.selectedProvider()!.id,
          payload as UpdateProviderRequest,
        );
        this.providers.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // Crear: añadir al final del array local
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

      // Actualización optimista local
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

  // ── Filtros y paginación ───────────────────────────────────────────────────
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1); // Reset a primera página
    this.loadProviders();
  }

  onStatusFilterChange(status: ProviderStatus | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadProviders();
  }

  onPageChange(event: PageEvent): void {
    this.page.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? 20);
    this.loadProviders(event);
  }

  // ── Utilidades ───────────────────────────────────────────────────────────
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
