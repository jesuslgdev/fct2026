import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard.page.component';
import { DashboardStore } from '@features/dashboard/state/dashboard.store';
import { signal, type WritableSignal } from '@angular/core';
import { DashboardData } from '@domain/models/dashboard.model';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let mockStore: {
    data: WritableSignal<DashboardData | null>;
    loading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    purchaseStatusSummary: WritableSignal<unknown[]>;
    salesStatusSummary: WritableSignal<unknown[]>;
    latestPurchases: WritableSignal<unknown[]>;
    latestSales: WritableSignal<unknown[]>;
    spendComparison: WritableSignal<unknown>;
    lowStockProducts: WritableSignal<unknown[]>;
    stalePurchases: WritableSignal<unknown[]>;
    staleSales: WritableSignal<unknown[]>;
    meta: WritableSignal<unknown>;
    hasAnyData: WritableSignal<boolean>;
    loadDashboard: Mock;
  };

  const mockDashboardData: DashboardData = {
    purchaseStatusSummary: [{ status: 'PENDING', count: 5 }],
    salesStatusSummary: [{ status: 'COMPLETED', count: 10 }],
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

  beforeEach(async () => {
    mockStore = {
      data: signal<DashboardData | null>(null),
      loading: signal(false),
      error: signal<string | null>(null),
      purchaseStatusSummary: signal(mockDashboardData.purchaseStatusSummary),
      salesStatusSummary: signal(mockDashboardData.salesStatusSummary),
      latestPurchases: signal([]),
      latestSales: signal([]),
      spendComparison: signal(null),
      lowStockProducts: signal([]),
      stalePurchases: signal([]),
      staleSales: signal([]),
      meta: signal(mockDashboardData.meta),
      hasAnyData: signal(true),
      loadDashboard: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
    })
      .overrideComponent(DashboardPageComponent, {
        set: {
          providers: [{ provide: DashboardStore, useValue: mockStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard on init', () => {
    expect(mockStore.loadDashboard).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    mockStore.loading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Cargando dashboard...');
  });

  it('should show error state', () => {
    mockStore.error.set('Error message');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Error message');
  });

  it('should show dashboard data', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Resumen general');
    expect(compiled.textContent).toContain('Compras por estado');
    expect(compiled.textContent).toContain('Ventas por estado');
    expect(compiled.textContent).toContain('5'); // Count for PENDING
    expect(compiled.textContent).toContain('10'); // Count for COMPLETED
  });

  it('should call loadDashboard on refresh', () => {
    component.onRefresh();
    expect(mockStore.loadDashboard).toHaveBeenCalledTimes(2);
  });

  describe('status helpers', () => {
    it('should return correct variant', () => {
      expect(component.statusVariant('pending')).toBe('warning');
      expect(component.statusVariant('delivered')).toBe('success');
      expect(component.statusVariant('unknown')).toBe('default');
    });

    it('should return correct label', () => {
      expect(component.statusLabel('pending')).toBe('Pendiente');
      expect(component.statusLabel('delivered')).toBe('Entregada');
      expect(component.statusLabel('unknown')).toBe('unknown');
    });
  });
});
