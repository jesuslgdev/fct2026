import {
  Warehouse,
  WarehouseAddress,
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
      addressData: WarehouseMapper.toAddressModel(dto.address),
      totalStock: dto.total_stock,
    };
  }

  private static fromAddressDto(dto: WarehouseAddressDto): string {
    return [dto.street, dto.city, dto.province, dto.postal_code].join(', ');
  }

  private static toAddressModel(dto: WarehouseAddressDto): WarehouseAddress {
    return {
      street: dto.street,
      city: dto.city,
      province: dto.province,
      postalCode: dto.postal_code,
    };
  }

  private static toAddressDto(address: WarehouseAddress): WarehouseAddressDto {
    return {
      street: address.street,
      city: address.city,
      province: address.province,
      postal_code: address.postalCode,
    };
  }

  static toCreateDto(payload: CreateWarehousePayload): CreateWarehouseDto {
    return {
      name: payload.name,
      address: WarehouseMapper.toAddressDto(payload.address),
    };
  }

  static toUpdateDto(payload: UpdateWarehousePayload): UpdateWarehouseDto {
    return {
      name: payload.name,
      address: WarehouseMapper.toAddressDto(payload.address),
    };
  }
}
