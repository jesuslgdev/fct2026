import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from '@domain/models/warehouse.model';
import {
  WarehouseDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '@infrastructure/dtos/warehouse.dto';

export class WarehouseMapper {
  static fromDto(dto: WarehouseDto): Warehouse {
    return {
      warehouseId: dto.warehouse_id,
      name: dto.name,
      address: dto.address,
      totalStock: dto.total_stock,
    };
  }

  static toCreateDto(payload: CreateWarehousePayload): CreateWarehouseDto {
    return {
      name: payload.name,
      address: payload.address,
    };
  }

  static toUpdateDto(payload: UpdateWarehousePayload): UpdateWarehouseDto {
    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.address !== undefined && { address: payload.address }),
    };
  }
}
