import { StockMovement, StockMovementDetail } from '@domain/models/stock-movement.model';
import { StockMovementItemDto, StockMovementDetailDto } from '@infrastructure/dtos/stock-movement.dto';

export class StockMovementMapper {
  static fromDto(dto: StockMovementItemDto): StockMovement {
    return {
      movementId: dto.movement_id,
      productName: dto.product_name,
      movementType: dto.movement_type,
      difference: dto.difference,
      reason: dto.reason,
      purchaseId: dto.purchase_id,
      saleId: dto.sale_id,
      createdAt: new Date(dto.created_at),
    };
  }

  static fromDetailDto(dto: StockMovementDetailDto): StockMovementDetail {
    return {
      ...StockMovementMapper.fromDto(dto),
      warehouseId: dto.warehouse_id,
      warehouseName: dto.warehouse_name,
      productId: dto.product_id,
      previousQuantity: dto.previous_quantity,
      newQuantity: dto.new_quantity,
      userEmail: dto.user_email,
    };
  }
}
