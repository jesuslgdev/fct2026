import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StockMovement, StockMovementDetail, ListStockMovementsPayload, MovementType } from '@domain/models/stock-movement.model';
import {
  StockMovementApiError,
  StockMovementForbiddenError,
  StockMovementNotFoundError,
  StockMovementUnauthorizedError,
  StockMovementValidationError,
} from '@domain/models/stock-movement-errors';
import { ListStockMovementsUseCase } from '@domain/usecases/stock-movement/list-stock-movements.usecase';
import { GetStockMovementByIdUseCase } from '@domain/usecases/stock-movement/get-stock-movement-by-id.usecase';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { Product } from '@domain/models/product.model';

export interface ProductOption {
  label: string;
  value: number;
}

const PRODUCT_PAGE_SIZE = 100;
const MAX_PRODUCT_PAGES = 25;

@Injectable()
export class MovementsStore {
  private readonly listMovementsUseCase = inject(ListStockMovementsUseCase);
  private readonly getMovementByIdUseCase = inject(GetStockMovementByIdUseCase);
  private readonly getProductsUseCase = inject(GetProductsUseCase);

  // ── List state ─────────────────────────────────────────────────────
  readonly movements = signal<StockMovement[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────
  readonly productOptions = signal<ProductOption[]>([]);
  readonly selectedProductId = signal<number | undefined>(undefined);
  readonly movementTypeFilter = signal<MovementType | undefined>(undefined);
  readonly dateFrom = signal<Date | undefined>(undefined);
  readonly dateTo = signal<Date | undefined>(undefined);
  readonly reasonSearch = signal('');
  readonly dateRangeError = signal<string | null>(null);

  // ── Detail dialog ──────────────────────────────────────────────────
  readonly selectedMovementDetail = signal<StockMovementDetail | null>(null);
  readonly detailDialogVisible = signal(false);
  readonly detailLoading = signal(false);

  // ── Computed ───────────────────────────────────────────────────────
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  readonly firstRecord = computed(() => (this.page() - 1) * this.pageSize());

  // ── Data loading ───────────────────────────────────────────────────
  loadMovements(): void {
    if (!this.validateDateRange()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: ListStockMovementsPayload = {
      productId: this.selectedProductId(),
      movementType: this.movementTypeFilter(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      reasonSearch: this.reasonSearch() || undefined,
    };

    this.listMovementsUseCase.execute(payload, this.page(), this.pageSize()).subscribe({
      next: (result) => {
        this.movements.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.resolveErrorMessage(err, 'Error al cargar los movimientos de stock.'));
        this.loading.set(false);
      },
    });
  }

  loadProductOptions(): void {
    this.fetchAllProducts(1, []).subscribe({
      next: (products) => {
        this.productOptions.set(
          products.map((p) => ({ label: p.name, value: p.productId })),
        );
      },
      error: () => {
        this.productOptions.set([]);
      },
    });
  }

  private fetchAllProducts(
    page: number,
    accumulated: Product[],
  ): Observable<Product[]> {
    return this.getProductsUseCase
      .execute({ page, pageSize: PRODUCT_PAGE_SIZE })
      .pipe(
        switchMap((result) => {
          const all: Product[] = [...accumulated, ...result.data];
          const reachedEnd =
            result.data.length < PRODUCT_PAGE_SIZE || page >= MAX_PRODUCT_PAGES;
          if (reachedEnd) {
            return of(all);
          }
          return this.fetchAllProducts(page + 1, all);
        }),
      );
  }

  // ── Pagination ─────────────────────────────────────────────────────
  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    this.loadMovements();
  }

  // ── Filters ────────────────────────────────────────────────────────
  applyFilters(): void {
    this.page.set(1);
    this.loadMovements();
  }

  clearFilters(): void {
    this.selectedProductId.set(undefined);
    this.movementTypeFilter.set(undefined);
    this.dateFrom.set(undefined);
    this.dateTo.set(undefined);
    this.reasonSearch.set('');
    this.dateRangeError.set(null);
    this.applyFilters();
  }

  private validateDateRange(): boolean {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from && to && from.getTime() > to.getTime()) {
      this.dateRangeError.set(
        '«Fecha desde» no puede ser posterior a «Fecha hasta».',
      );
      return false;
    }
    this.dateRangeError.set(null);
    return true;
  }

  // ── Detail dialog ──────────────────────────────────────────────────
  openDetailDialog(movement: StockMovement): void {
    this.selectedMovementDetail.set(null);
    this.detailDialogVisible.set(true);
    this.detailLoading.set(true);

    this.getMovementByIdUseCase.execute(movement.movementId).subscribe({
      next: (detail) => {
        this.selectedMovementDetail.set(detail);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.error.set(this.resolveErrorMessage(err, 'Error al cargar el detalle del movimiento.'));
        this.detailLoading.set(false);
        this.detailDialogVisible.set(false);
      },
    });
  }

  closeDetailDialog(): void {
    this.detailDialogVisible.set(false);
    this.selectedMovementDetail.set(null);
  }

  // ── Error handling ─────────────────────────────────────────────────
  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof StockMovementValidationError) {
      return err.message || 'Por favor, revisa los datos enviados.';
    }
    if (err instanceof StockMovementUnauthorizedError) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
    }
    if (err instanceof StockMovementForbiddenError) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (err instanceof StockMovementNotFoundError) {
      return 'El movimiento seleccionado ya no existe.';
    }
    if (err instanceof StockMovementApiError) {
      return err.message || fallback;
    }
    return fallback;
  }
}
