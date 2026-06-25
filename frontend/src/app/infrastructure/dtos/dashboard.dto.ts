export interface DashboardStatusSummaryDto {
  status: string;
  count: number;
}

export interface DashboardRecentRecordDto {
  number: string;
  counterpart_name: string | null;
  status: string;
  total: number | string;
  created_at: string;
}

export interface DashboardSpendComparisonDto {
  current_month: number | string;
  previous_month: number | string;
  difference_amount: number | string;
  difference_percent: number | string | null;
}

export interface DashboardLowStockProductDto {
  product_id: number;
  product_code: string;
  product_name: string;
  stock_current: number;
  stock_min: number;
}

export interface DashboardStaleRecordDto {
  number: string;
  status: string;
  status_changed_at: string;
  days_in_status: number;
}

export interface DashboardMetaDto {
  generated_at: string;
  stale_days: number;
  recent_limit: number;
}

export interface DashboardDto {
  purchase_status_summary: DashboardStatusSummaryDto[];
  sales_status_summary: DashboardStatusSummaryDto[];
  latest_purchases: DashboardRecentRecordDto[];
  latest_sales: DashboardRecentRecordDto[];
  purchase_spend_comparison: DashboardSpendComparisonDto | null;
  low_stock_products: DashboardLowStockProductDto[];
  stale_purchases: DashboardStaleRecordDto[];
  stale_sales: DashboardStaleRecordDto[];
  meta: DashboardMetaDto;
}
