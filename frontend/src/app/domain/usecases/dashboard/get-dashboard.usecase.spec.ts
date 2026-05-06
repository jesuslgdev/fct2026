import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GetDashboardUseCase } from './get-dashboard.usecase';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { DashboardData } from '@domain/models/dashboard.model';

describe('GetDashboardUseCase', () => {
  let useCase: GetDashboardUseCase;
  let repository: { getDashboard: Mock };

  const mockDashboardData: DashboardData = {
    purchaseStatusSummary: [],
    salesStatusSummary: [],
    latestPurchases: [],
    latestSales: [],
    purchaseSpendComparison: null,
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
    repository = {
      getDashboard: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GetDashboardUseCase,
        { provide: DashboardRepository, useValue: repository },
      ],
    });

    useCase = TestBed.inject(GetDashboardUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call repository.getDashboard and return data', async () => {
    repository.getDashboard.mockReturnValue(of(mockDashboardData));

    const result = await new Promise((resolve) => {
      useCase.execute().subscribe(resolve);
    });

    expect(result).toEqual(mockDashboardData);
    expect(repository.getDashboard).toHaveBeenCalledTimes(1);
  });
});
