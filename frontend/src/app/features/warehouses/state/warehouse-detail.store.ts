import { Injectable, computed, inject, signal } from '@angular/core';
import { TablePageEvent } from 'primeng/table';
import { StockDistributionItem } from '@domain/models/stock-distribution.model';
import {
  StockDistributionApiError,
  StockDistributionValidationError,
  WarehouseNotFoundError as StockWarehouseNotFoundError,
} from '@domain/models/stock-distribution-errors';
import { Warehouse } from '@domain/models/warehouse.model';
import {
  WarehouseApiError,
  WarehouseNotFoundError,
  WarehouseValidationError,
} from '@domain/models/warehouse-errors';
import { GetStockDistributionUseCase } from '@domain/usecases/stock-distribution/get-stock-distribution.usecase';
import { GetWarehouseByIdUseCase } from '@domain/usecases/warehouse/get-warehouse-by-id.usecase';

@Injectable()
export class WarehouseDetailStore {
  private readonly warehouseValidationTranslations = new Map<string, string>([
    ['Name is required.', 'El nombre es obligatorio.'],
    ['Name must be between 2 and 100 characters.', 'El nombre debe tener entre 2 y 100 caracteres.'],
    ['Street is required.', 'La direccion es obligatoria.'],
    ['Street must be between 5 and 255 characters.', 'La direccion debe tener entre 5 y 255 caracteres.'],
    ['City is required.', 'La ciudad es obligatoria.'],
    ['City cannot exceed 100 characters.', 'La ciudad no puede superar 100 caracteres.'],
    ['Province is required.', 'La provincia es obligatoria.'],
    ['Province cannot exceed 100 characters.', 'La provincia no puede superar 100 caracteres.'],
    ['Postal code is required.', 'El codigo postal es obligatorio.'],
    ['Postal code cannot exceed 10 characters.', 'El codigo postal no puede superar 10 caracteres.'],
    ['Warehouse ID must be a positive integer.', 'El identificador del almacen debe ser un entero positivo.'],
  ]);

  private readonly stockValidationTranslations = new Map<string, string>([
    ['Warehouse ID must be a positive integer.', 'El identificador del almacen debe ser un entero positivo.'],
    ['Product ID must be a positive integer.', 'El identificador del producto debe ser un entero positivo.'],
    ['Page size must be an integer between 1 and 100.', 'El tamano de pagina debe ser un entero entre 1 y 100.'],
    ['Product name filter cannot exceed 255 characters.', 'El filtro por nombre de producto no puede superar 255 caracteres.'],
  ]);

  private readonly getWarehouseByIdUseCase = inject(GetWarehouseByIdUseCase);
  private readonly getStockDistributionUseCase = inject(GetStockDistributionUseCase);

  readonly warehouseId = signal<number | null>(null);
  readonly warehouse = signal<Warehouse | null>(null);
  readonly stockItems = signal<StockDistributionItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly productNameFilter = signal('');
  readonly loadingWarehouse = signal(false);
  readonly loadingStock = signal(false);
  readonly error = signal<string | null>(null);
  readonly stockError = signal<string | null>(null);

  readonly availableStockItems = computed(() =>
    this.stockItems().filter((item) => item.availableStock > 0),
  );

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  init(warehouseId: number): void {
    this.warehouseId.set(warehouseId);
    this.page.set(1);
    this.pageSize.set(20);
    this.productNameFilter.set('');
    this.loadWarehouse();
    this.loadStock();
  }

  showInvalidWarehouseIdError(): void {
    this.error.set('El identificador del almacen debe ser un entero positivo.');
    this.stockError.set(null);
  }

  loadWarehouse(): void {
    const warehouseId = this.warehouseId();
    if (!warehouseId) return;

    this.loadingWarehouse.set(true);
    this.error.set(null);

    this.getWarehouseByIdUseCase.execute(warehouseId).subscribe({
      next: (warehouse) => {
        this.warehouse.set(warehouse);
        this.loadingWarehouse.set(false);
      },
      error: (err) => {
        this.error.set(this.resolveWarehouseErrorMessage(err, 'No se pudo cargar el almacen.'));
        this.loadingWarehouse.set(false);
      },
    });
  }

  loadStock(): void {
    const warehouseId = this.warehouseId();
    if (!warehouseId) return;

    this.loadingStock.set(true);
    this.stockError.set(null);

    this.getStockDistributionUseCase.execute({
      warehouseId,
      page: this.page(),
      pageSize: this.pageSize(),
      productName: this.productNameFilter() || undefined,
    }).subscribe({
      next: (result) => {
        this.stockItems.set(result.data);
        this.total.set(result.total);
        this.page.set(result.page);
        this.pageSize.set(result.pageSize);
        this.loadingStock.set(false);
      },
      error: (err) => {
        this.stockError.set(this.resolveStockErrorMessage(err, 'No se pudo cargar el stock.'));
        this.loadingStock.set(false);
      },
    });
  }

  onStockSearch(query: string): void {
    this.productNameFilter.set(query.trim());
    this.page.set(1);
    this.loadStock();
  }

  onStockPageChange(event: TablePageEvent): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    this.loadStock();
  }

  private resolveWarehouseErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof WarehouseValidationError) {
      return this.translateWarehouseValidationError(err, 'Revisa los datos enviados.');
    }

    if (err instanceof WarehouseNotFoundError) {
      return 'El almacen seleccionado ya no existe.';
    }

    if (err instanceof WarehouseApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  private resolveStockErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof StockDistributionValidationError) {
      return this.translateStockValidationError(err, 'Revisa los datos enviados.');
    }

    if (err instanceof StockWarehouseNotFoundError) {
      return 'El almacen seleccionado ya no existe.';
    }

    if (err instanceof StockDistributionApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  private translateWarehouseValidationError(err: WarehouseValidationError, fallback: string): string {
    return this.warehouseValidationTranslations.get(err.message) ?? (err.message || fallback);
  }

  private translateStockValidationError(err: StockDistributionValidationError, fallback: string): string {
    return this.stockValidationTranslations.get(err.message) ?? (err.message || fallback);
  }
}
