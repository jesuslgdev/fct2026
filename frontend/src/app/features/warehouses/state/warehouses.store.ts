import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from '@domain/models/warehouse.model';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';
import { CreateWarehouseUseCase } from '@domain/usecases/warehouse/create-warehouse.usecase';
import { UpdateWarehouseUseCase } from '@domain/usecases/warehouse/update-warehouse.usecase';
import { DeleteWarehouseUseCase } from '@domain/usecases/warehouse/delete-warehouse.usecase';
import { GetWarehouseByNameUseCase } from '@domain/usecases/warehouse/get-warehouse-by-name.usecase';
import {
  WarehouseAlreadyExistsError,
  WarehouseApiError,
  WarehouseForbiddenError,
  WarehouseHasStockError,
  WarehouseNotFoundError,
  WarehouseUnauthorizedError,
  WarehouseValidationError,
} from '@domain/models/warehouse-errors';

export type DialogMode = 'create' | 'edit';

@Injectable()
export class WarehousesStore {
  private readonly authService = inject(AuthService);
  private readonly getWarehousesUseCase = inject(GetWarehousesUseCase);
  private readonly createWarehouseUseCase = inject(CreateWarehouseUseCase);
  private readonly updateWarehouseUseCase = inject(UpdateWarehouseUseCase);
  private readonly deleteWarehouseUseCase = inject(DeleteWarehouseUseCase);
  private readonly getWarehouseByNameUseCase = inject(GetWarehouseByNameUseCase);

  // ── State ──────────────────────────────────────────────────────────
  readonly warehouses = signal<Warehouse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedWarehouse = signal<Warehouse | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly warehouseToDelete = signal<Warehouse | null>(null);

  // ── Computed ───────────────────────────────────────────────────────
  readonly canEdit = computed(() => this.authService.user()?.role === 'Administrator');

  // ── Data loading ───────────────────────────────────────────────────
  async loadWarehouses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const warehouses = await this.getWarehousesUseCase.execute();
      this.warehouses.set(warehouses);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load warehouses.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedWarehouse.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEditDialog(warehouse: Warehouse): void {
    this.selectedWarehouse.set(warehouse);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedWarehouse.set(null);
  }

  // ── Confirm delete dialog ───────────────────────────────────────────────
  requestDeleteWarehouse(warehouse: Warehouse): void {
    this.warehouseToDelete.set(warehouse);
    this.confirmDialogVisible.set(true);
  }

  cancelDeleteWarehouse(): void {
    this.warehouseToDelete.set(null);
    this.confirmDialogVisible.set(false);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async saveWarehouse(payload: CreateWarehousePayload | UpdateWarehousePayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedWarehouse()) {
        const current = this.selectedWarehouse()!;
        const updatePayload: UpdateWarehousePayload = {
          name: payload.name ?? current.name,
          address: payload.address ?? current.address,
        };
        const updated = await this.updateWarehouseUseCase.execute(
          current.warehouseId,
          updatePayload,
        );
        this.warehouses.update((list) =>
          list.map((w) => (w.warehouseId === updated.warehouseId ? updated : w)),
        );
      } else {
        const created = await this.createWarehouseUseCase.execute(payload as CreateWarehousePayload);
        this.warehouses.update((list) => [...list, created]);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save warehouse.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmDeleteWarehouse(): Promise<void> {
    const warehouse = this.warehouseToDelete();
    if (!warehouse) return;
    
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.deleteWarehouseUseCase.execute(warehouse.warehouseId);
      this.warehouses.update((list) => 
        list.filter((w) => w.warehouseId !== warehouse.warehouseId),
      );
      this.confirmDialogVisible.set(false);
      this.warehouseToDelete.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to delete warehouse.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Search ───────────────────────────────────────────────────────────────────
  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  async searchWarehouseByName(name: string): Promise<Warehouse | null> {
    try {
      return await this.getWarehouseByNameUseCase.execute(name);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to search warehouse.'));
      return null;
    }
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof WarehouseValidationError) {
      return err.message || 'Please check the submitted data.';
    }

    if (err instanceof WarehouseAlreadyExistsError) {
      return 'A warehouse with this name already exists.';
    }

    if (err instanceof WarehouseHasStockError) {
      return 'Cannot delete warehouse with existing stock.';
    }

    if (err instanceof WarehouseUnauthorizedError) {
      return 'Your session has expired. Please sign in again.';
    }

    if (err instanceof WarehouseForbiddenError) {
      return 'You do not have permissions to perform this action.';
    }

    if (err instanceof WarehouseNotFoundError) {
      return 'The selected warehouse no longer exists.';
    }

    if (err instanceof WarehouseApiError) {
      return err.message || fallback;
    }

    return fallback;
  }
}
