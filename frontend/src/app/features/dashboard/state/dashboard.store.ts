import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { GetDashboardUseCase } from '@domain/usecases/dashboard/get-dashboard.usecase';
import { DashboardData } from '@domain/models/dashboard.model';
import {
  DashboardApiError,
  DashboardForbiddenError,
  DashboardUnauthorizedError,
} from '@domain/models/dashboard-errors';

@Injectable()
export class DashboardStore {
  private readonly getDashboardUseCase = inject(GetDashboardUseCase);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly purchaseStatusSummary = computed(
    () => this.data()?.purchaseStatusSummary ?? [],
  );
  readonly salesStatusSummary = computed(() => this.data()?.salesStatusSummary ?? []);
  readonly latestPurchases = computed(() => this.data()?.latestPurchases ?? []);
  readonly latestSales = computed(() => this.data()?.latestSales ?? []);
  readonly spendComparison = computed(() => this.data()?.purchaseSpendComparison ?? null);
  readonly lowStockProducts = computed(() => this.data()?.lowStockProducts ?? []);
  readonly stalePurchases = computed(() => this.data()?.stalePurchases ?? []);
  readonly staleSales = computed(() => this.data()?.staleSales ?? []);
  readonly meta = computed(() => this.data()?.meta ?? null);

  readonly hasAnyData = computed(() => {
    const snapshot = this.data();
    if (!snapshot) {
      return false;
    }

    return (
      snapshot.purchaseStatusSummary.length > 0 ||
      snapshot.salesStatusSummary.length > 0 ||
      snapshot.latestPurchases.length > 0 ||
      snapshot.latestSales.length > 0 ||
      snapshot.lowStockProducts.length > 0 ||
      snapshot.stalePurchases.length > 0 ||
      snapshot.staleSales.length > 0 ||
      snapshot.purchaseSpendComparison !== null
    );
  });

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof DashboardUnauthorizedError) {
      return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
    }

    if (err instanceof DashboardForbiddenError) {
      return 'No tienes permisos para consultar este dashboard.';
    }

    if (err instanceof DashboardApiError) {
      return err.message;
    }

    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }

    return 'No se pudo cargar la información del dashboard.';
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.getDashboardUseCase
      .execute()
      .pipe(
        tap((result) => this.data.set(result)),
        catchError((err) => {
          this.error.set(this.resolveErrorMessage(err));
          this.data.set(null);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
