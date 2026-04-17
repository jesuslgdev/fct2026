import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from '@domain/models/warehouse.model';
import {
  WarehouseDto,
  WarehouseAddressDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '@infrastructure/dtos/warehouse.dto';

export class WarehouseMapper {
  static fromDto(dto: WarehouseDto): Warehouse {
    return {
      warehouseId: dto.warehouse_id,
      name: dto.name,
      address: WarehouseMapper.fromAddressDto(dto.address),
      totalStock: dto.total_stock,
    };
  }

  private static fromAddressDto(dto: WarehouseAddressDto): string {
    return [dto.street, dto.city, dto.province, dto.postal_code].join(', ');
  }

  static toCreateDto(payload: CreateWarehousePayload): CreateWarehouseDto {
    return {
      name: payload.name,
      address: payload.address,
    };
  }

  static toUpdateDto(payload: UpdateWarehousePayload): UpdateWarehouseDto {
    return {
      name: payload.name,
      address: payload.address,
    };
  }
}
