import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpDashboardRepository } from './dashboard.repository.http';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { environment } from 'environments/environment';
import { DashboardDto } from '@infrastructure/dtos/dashboard.dto';
import { DashboardUnauthorizedError, DashboardForbiddenError, DashboardApiError } from '@domain/models/dashboard-errors';

describe('HttpDashboardRepository', () => {
  let repository: HttpDashboardRepository;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/v1/dashboard`;

  const mockDto: DashboardDto = {
    purchase_status_summary: [],
    sales_status_summary: [],
    latest_purchases: [],
    latest_sales: [],
    purchase_spend_comparison: null,
    low_stock_products: [],
    stale_purchases: [],
    stale_sales: [],
    meta: {
      generated_at: '2026-05-06T12:00:00Z',
      stale_days: 7,
      recent_limit: 5,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpDashboardRepository,
        { provide: DashboardRepository, useClass: HttpDashboardRepository }
      ],
    });

    repository = TestBed.inject(HttpDashboardRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should get dashboard data and map it', () => {
    repository.getDashboard().subscribe((data) => {
      expect(data).toBeTruthy();
      expect(data.meta.staleDays).toBe(7);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockDto);
  });

  it('should map 401 error to DashboardUnauthorizedError', () => {
    repository.getDashboard().subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(DashboardUnauthorizedError);
      },
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should map 403 error to DashboardForbiddenError', () => {
    repository.getDashboard().subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(DashboardForbiddenError);
      },
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('should map generic error to DashboardApiError', () => {
    repository.getDashboard().subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(DashboardApiError);
      },
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
