import {
  AdjustStockPayload,
  AdjustStockResult,
  StockDistributionFilters,
  StockDistributionItem,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import {
  AdjustStockDto,
  AdjustStockResponseDto,
  StockDistributionItemDto,
  StockDistributionPageDto,
} from '@infrastructure/dtos/stock-distribution.dto';

export class StockDistributionMapper {
  static fromItemDto(dto: StockDistributionItemDto): StockDistributionItem {
    return {
      warehouseId: dto.warehouse_id,
      warehouseName: dto.warehouse_name,
      productId: dto.product_id,
      productCode: dto.product_code,
      productName: dto.product_name,
      stock: dto.stock,
      reservedStock: dto.reserved_stock,
      availableStock: dto.available_stock,
    };
  }

  static fromPageDto(dto: StockDistributionPageDto): StockDistributionListResult {
    return {
      data: dto.items.map(StockDistributionMapper.fromItemDto),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  }

  static toQueryParams(
    filters: StockDistributionFilters,
  ): Record<string, string | number> {
    const query: Record<string, string | number> = {};

    if (filters.page !== undefined) {
      query['page'] = filters.page;
    }

    if (filters.pageSize !== undefined) {
      query['page_size'] = filters.pageSize;
    }

    if (filters.warehouseId !== undefined) {
      query['warehouse_id'] = filters.warehouseId;
    }

    if (filters.productId !== undefined) {
      query['product_id'] = filters.productId;
    }

    if (filters.productName) {
      query['search'] = filters.productName;
    }

    return query;
  }

  static toAdjustStockDto(payload: AdjustStockPayload): AdjustStockDto {
    return {
      warehouse_id: payload.warehouseId,
      product_id: payload.productId,
      new_quantity: payload.newQuantity,
      ...(payload.reason !== undefined ? { reason: payload.reason } : {}),
    };
  }

  static fromAdjustStockResponseDto(dto: AdjustStockResponseDto): AdjustStockResult {
    return {
      movementId: dto.movement_id,
      warehouseId: dto.warehouse_id,
      productId: dto.product_id,
      previousQuantity: dto.previous_quantity,
      newQuantity: dto.new_quantity,
      difference: dto.difference,
      globalStock: dto.global_stock,
      createdAt: dto.created_at,
    };
  }
}
