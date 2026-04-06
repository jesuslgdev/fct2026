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

  // ── State ──────────────────────────────────────────────────────────
  readonly warehouses = signal<Warehouse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dialogError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedWarehouse = signal<Warehouse | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly warehouseToDelete = signal<Warehouse | null>(null);

  // ── Computed ───────────────────────────────────────────────────────
  readonly canEdit = computed(() => this.authService.user()?.role === 'Administrator');
  
  readonly filteredWarehouses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.warehouses();
    return this.warehouses().filter(
      w => w.name.toLowerCase().includes(query) || w.address.toLowerCase().includes(query)
    );
  });

  // ── Data loading ───────────────────────────────────────────────────
  loadWarehouses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.getWarehousesUseCase.execute().subscribe({
      next: (warehouses) => {
        this.warehouses.set(warehouses);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.resolveErrorMessage(err, 'Error al cargar los almacenes.'));
        this.loading.set(false);
      }
    });
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedWarehouse.set(null);
    this.dialogMode.set('create');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
  }

  openEditDialog(warehouse: Warehouse): void {
    this.selectedWarehouse.set(warehouse);
    this.dialogMode.set('edit');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.dialogError.set(null);
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
  saveWarehouse(payload: CreateWarehousePayload | UpdateWarehousePayload): void {
    this.loading.set(true);
    this.dialogError.set(null);

    if (this.dialogMode() === 'edit' && this.selectedWarehouse()) {
      const current = this.selectedWarehouse()!;
      const updatePayload: UpdateWarehousePayload = {
        name: payload.name ?? current.name,
        address: payload.address ?? current.address,
      };

      this.updateWarehouseUseCase.execute(current.warehouseId, updatePayload).subscribe({
        next: (updated) => {
          this.warehouses.update((list) =>
            list.map((w) => (w.warehouseId === updated.warehouseId ? updated : w)),
          );
          this.closeDialog();
          this.loading.set(false);
        },
        error: (err) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'Error al guardar el almacén.'));
          this.loading.set(false);
        }
      });
    } else {
      this.createWarehouseUseCase.execute(payload as CreateWarehousePayload).subscribe({
        next: (created) => {
          this.warehouses.update((list) => [...list, created]);
          this.closeDialog();
          this.loading.set(false);
        },
        error: (err) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'Error al guardar el almacén.'));
          this.loading.set(false);
        }
      });
    }
  }

  confirmDeleteWarehouse(): void {
    const warehouse = this.warehouseToDelete();
    if (!warehouse) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.deleteWarehouseUseCase.execute(warehouse.warehouseId).subscribe({
      next: () => {
        this.warehouses.update((list) => 
          list.filter((w) => w.warehouseId !== warehouse.warehouseId),
        );
        this.confirmDialogVisible.set(false);
        this.warehouseToDelete.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.resolveErrorMessage(err, 'Error al eliminar el almacén.'));
        this.loading.set(false);
      }
    });
  }

  // ── Search ───────────────────────────────────────────────────────────────────
  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof WarehouseValidationError) {
      return err.message || 'Por favor, revisa los datos enviados.';
    }

    if (err instanceof WarehouseAlreadyExistsError) {
      return 'Ya existe un almacén con este nombre.';
    }

    if (err instanceof WarehouseHasStockError) {
      return 'No se puede eliminar un almacén con stock existente.';
    }

    if (err instanceof WarehouseUnauthorizedError) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
    }

    if (err instanceof WarehouseForbiddenError) {
      return 'No tienes permisos para realizar esta acción.';
    }

    if (err instanceof WarehouseNotFoundError) {
      return 'El almacén seleccionado ya no existe.';
    }

    if (err instanceof WarehouseApiError) {
      return err.message || fallback;
    }

    return fallback;
  }
}
