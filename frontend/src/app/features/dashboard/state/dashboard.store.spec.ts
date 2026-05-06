import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardStore } from './dashboard.store';
import { GetDashboardUseCase } from '@domain/usecases/dashboard/get-dashboard.usecase';
import { DashboardData } from '@domain/models/dashboard.model';
import { DashboardForbiddenError, DashboardUnauthorizedError } from '@domain/models/dashboard-errors';

describe('DashboardStore', () => {
  let store: DashboardStore;
  let getDashboardUseCase: { execute: Mock };

  const mockDashboardData: DashboardData = {
    purchaseStatusSummary: [{ status: 'PENDING', count: 5 }],
    salesStatusSummary: [],
    latestPurchases: [],
    latestSales: [],
    purchaseSpendComparison: {
      currentMonth: 100,
      previousMonth: 50,
      differenceAmount: 50,
      differencePercent: 100,
    },
    lowStockProducts: [],
    stalePurchases: [],
    staleSales: [],
    meta: {
      generatedAt: '2026-05-06T12:00:00Z',
      staleDays: 7,
      recentLimit: 5,
    },
  };

  beforeEach(() => {
    getDashboardUseCase = {
      execute: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: GetDashboardUseCase, useValue: getDashboardUseCase },
      ],
    });

    store = TestBed.inject(DashboardStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(store.data()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasAnyData()).toBe(false);
  });

  it('should load dashboard data successfully', () => {
    getDashboardUseCase.execute.mockReturnValue(of(mockDashboardData));

    store.loadDashboard();

    expect(store.loading()).toBe(false);
    expect(store.data()).toEqual(mockDashboardData);
    expect(store.purchaseStatusSummary()).toEqual(mockDashboardData.purchaseStatusSummary);
    expect(store.spendComparison()).toEqual(mockDashboardData.purchaseSpendComparison);
    expect(store.hasAnyData()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('should handle unauthorized error', () => {
    getDashboardUseCase.execute.mockReturnValue(throwError(() => new DashboardUnauthorizedError()));

    store.loadDashboard();

    expect(store.loading()).toBe(false);
    expect(store.data()).toBeNull();
    expect(store.error()).toContain('sesión ha expirado');
  });

  it('should handle forbidden error', () => {
    getDashboardUseCase.execute.mockReturnValue(throwError(() => new DashboardForbiddenError()));

    store.loadDashboard();

    expect(store.loading()).toBe(false);
    expect(store.error()).toContain('No tienes permisos');
  });

  it('should handle generic error', () => {
    getDashboardUseCase.execute.mockReturnValue(throwError(() => new Error('Unknown error')));

    store.loadDashboard();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Unknown error');
  });
});
