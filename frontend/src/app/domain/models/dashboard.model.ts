export interface DashboardStatusSummary {
  status: string;
  count: number;
}

export interface DashboardRecentRecord {
  number: string;
  counterpartName: string | null;
  status: string;
  total: number;
  createdAt: string;
}

export interface DashboardSpendComparison {
  currentMonth: number;
  previousMonth: number;
  differenceAmount: number;
  differencePercent: number | null;
}

export interface DashboardLowStockProduct {
  productId: number;
  productCode: string;
  productName: string;
  stockCurrent: number;
  stockMin: number;
}

export interface DashboardStaleRecord {
  number: string;
  status: string;
  statusChangedAt: string;
  daysInStatus: number;
}

export interface DashboardMeta {
  generatedAt: string;
  staleDays: number;
  recentLimit: number;
}

export interface DashboardData {
  purchaseStatusSummary: DashboardStatusSummary[];
  salesStatusSummary: DashboardStatusSummary[];
  latestPurchases: DashboardRecentRecord[];
  latestSales: DashboardRecentRecord[];
  purchaseSpendComparison: DashboardSpendComparison | null;
  lowStockProducts: DashboardLowStockProduct[];
  stalePurchases: DashboardStaleRecord[];
  staleSales: DashboardStaleRecord[];
  meta: DashboardMeta;
}
