import {
  DashboardData,
  DashboardLowStockProduct,
  DashboardMeta,
  DashboardRecentRecord,
  DashboardSpendComparison,
  DashboardStaleRecord,
  DashboardStatusSummary,
} from '@domain/models/dashboard.model';
import {
  DashboardDto,
  DashboardLowStockProductDto,
  DashboardMetaDto,
  DashboardRecentRecordDto,
  DashboardSpendComparisonDto,
  DashboardStaleRecordDto,
  DashboardStatusSummaryDto,
} from '@infrastructure/dtos/dashboard.dto';

export class DashboardMapper {
  private static toNumber(value: number | string | null): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  static statusSummaryFromDto(dto: DashboardStatusSummaryDto): DashboardStatusSummary {
    return {
      status: dto.status,
      count: dto.count,
    };
  }

  static recentRecordFromDto(dto: DashboardRecentRecordDto): DashboardRecentRecord {
    return {
      number: dto.number,
      counterpartName: dto.counterpart_name,
      status: dto.status,
      total: DashboardMapper.toNumber(dto.total),
      createdAt: dto.created_at,
    };
  }

  static spendComparisonFromDto(
    dto: DashboardSpendComparisonDto | null,
  ): DashboardSpendComparison | null {
    if (!dto) {
      return null;
    }

    return {
      currentMonth: DashboardMapper.toNumber(dto.current_month),
      previousMonth: DashboardMapper.toNumber(dto.previous_month),
      differenceAmount: DashboardMapper.toNumber(dto.difference_amount),
      differencePercent:
        dto.difference_percent === null
          ? null
          : DashboardMapper.toNumber(dto.difference_percent),
    };
  }

  static lowStockProductFromDto(dto: DashboardLowStockProductDto): DashboardLowStockProduct {
    return {
      productId: dto.product_id,
      productCode: dto.product_code,
      productName: dto.product_name,
      stockCurrent: dto.stock_current,
      stockMin: dto.stock_min,
    };
  }

  static staleRecordFromDto(dto: DashboardStaleRecordDto): DashboardStaleRecord {
    return {
      number: dto.number,
      status: dto.status,
      statusChangedAt: dto.status_changed_at,
      daysInStatus: dto.days_in_status,
    };
  }

  static metaFromDto(dto: DashboardMetaDto): DashboardMeta {
    return {
      generatedAt: dto.generated_at,
      staleDays: dto.stale_days,
      recentLimit: dto.recent_limit,
    };
  }

  static fromDto(dto: DashboardDto): DashboardData {
    return {
      purchaseStatusSummary: dto.purchase_status_summary.map(
        DashboardMapper.statusSummaryFromDto,
      ),
      salesStatusSummary: dto.sales_status_summary.map(
        DashboardMapper.statusSummaryFromDto,
      ),
      latestPurchases: dto.latest_purchases.map(DashboardMapper.recentRecordFromDto),
      latestSales: dto.latest_sales.map(DashboardMapper.recentRecordFromDto),
      purchaseSpendComparison: DashboardMapper.spendComparisonFromDto(
        dto.purchase_spend_comparison,
      ),
      lowStockProducts: dto.low_stock_products.map(DashboardMapper.lowStockProductFromDto),
      stalePurchases: dto.stale_purchases.map(DashboardMapper.staleRecordFromDto),
      staleSales: dto.stale_sales.map(DashboardMapper.staleRecordFromDto),
      meta: DashboardMapper.metaFromDto(dto.meta),
    };
  }
}
