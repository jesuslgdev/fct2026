import { describe, it, expect } from 'vitest';
import { DashboardMapper } from './dashboard.mapper';
import { DashboardDto } from '../dtos/dashboard.dto';

describe('DashboardMapper', () => {
  const mockDto: DashboardDto = {
    purchase_status_summary: [{ status: 'PENDING', count: 5 }],
    sales_status_summary: [{ status: 'COMPLETED', count: 10 }],
    latest_purchases: [
      {
        number: 'P001',
        counterpart_name: 'Supplier A',
        status: 'PENDING',
        total: '100.50',
        created_at: '2026-05-01T10:00:00Z',
      },
    ],
    latest_sales: [
      {
        number: 'S001',
        counterpart_name: 'Client B',
        status: 'COMPLETED',
        total: 200.75,
        created_at: '2026-05-02T11:00:00Z',
      },
    ],
    purchase_spend_comparison: {
      current_month: '500.00',
      previous_month: 400,
      difference_amount: '100.00',
      difference_percent: '25',
    },
    low_stock_products: [
      {
        product_id: 1,
        product_code: 'PROD01',
        product_name: 'Product 1',
        stock_current: 2,
        stock_min: 5,
      },
    ],
    stale_purchases: [
      {
        number: 'P002',
        status: 'PENDING',
        status_changed_at: '2026-04-20T10:00:00Z',
        days_in_status: 16,
      },
    ],
    stale_sales: [],
    meta: {
      generated_at: '2026-05-06T12:00:00Z',
      stale_days: 7,
      recent_limit: 5,
    },
  };

  it('should map DashboardDto to DashboardData', () => {
    const result = DashboardMapper.fromDto(mockDto);

    expect(result.purchaseStatusSummary[0].status).toBe('PENDING');
    expect(result.purchaseStatusSummary[0].count).toBe(5);
    expect(result.latestPurchases[0].number).toBe('P001');
    expect(result.latestPurchases[0].total).toBe(100.5);
    expect(result.purchaseSpendComparison?.currentMonth).toBe(500);
    expect(result.purchaseSpendComparison?.differencePercent).toBe(25);
    expect(result.lowStockProducts[0].productName).toBe('Product 1');
    expect(result.meta.staleDays).toBe(7);
  });

  it('should handle null values in spend comparison', () => {
    const dtoWithNulls: DashboardDto = {
      ...mockDto,
      purchase_spend_comparison: null,
    };

    const result = DashboardMapper.fromDto(dtoWithNulls);
    expect(result.purchaseSpendComparison).toBeNull();
  });

  it('should handle string and number types in numeric fields', () => {
    const dtoWithMixedTypes: DashboardDto = {
      ...mockDto,
      purchase_spend_comparison: {
        current_month: '100',
        previous_month: 50,
        difference_amount: '50',
        difference_percent: null,
      },
    };

    const result = DashboardMapper.fromDto(dtoWithMixedTypes);
    expect(result.purchaseSpendComparison?.currentMonth).toBe(100);
    expect(result.purchaseSpendComparison?.previousMonth).toBe(50);
    expect(result.purchaseSpendComparison?.differencePercent).toBeNull();
  });
});
