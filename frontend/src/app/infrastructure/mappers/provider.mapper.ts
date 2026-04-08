import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@domain/models/provider.model';
import { ProviderProduct } from '@domain/models/provider-product.model';
import {
  ProviderDto,
  CreateProviderDto,
  UpdateProviderDto,
  SetProviderActiveDto,
  ProvidersPageDto,
  ProviderProductDto,
  ProviderProductsDto,
} from '@infrastructure/dtos/provider.dto';
import { ProviderStatus } from '@domain/enums/provider-status.enum';

export class ProviderMapper {
  private static resolveProviderId(dto: ProviderDto): string {
    const rawId = dto.supplier_id ?? dto.provider_id;
    return (rawId ?? '').toString();
  }

  // DTO → Domain
  static fromDto(dto: ProviderDto): Provider {
    return {
      id: ProviderMapper.resolveProviderId(dto),
      name: dto.name,
      taxId: dto.tax_id,
      email: dto.email ?? '',
      phone: dto.phone ?? undefined,
      address: dto.address ?? undefined,
      contactPerson: dto.contact_person ?? undefined,
      isActive: dto.is_active,
      status: dto.status ?? (dto.is_active ? ProviderStatus.ACTIVE : ProviderStatus.INACTIVE),
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
  }

  // DTO Detail → Domain
  static fromDetailDto(dto: ProviderDto): Provider {
    return ProviderMapper.fromDto(dto);
  }

  // Helper entity DTO → Domain
  static productFromDto(dto: ProviderProductDto): ProviderProduct {
    return {
      id: dto.id.toString(),
      productId: dto.product_id.toString(),
      productName: dto.product_name,
      providerId: dto.provider_id.toString(),
      specificPrice: dto.specific_price,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }

  // Domain → DTO (for create payload)
  static toCreateDto(payload: CreateProviderRequest): CreateProviderDto {
    return {
      name: payload.name,
      tax_id: payload.taxId,
      email: payload.email,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      contact_person: payload.contactPerson ?? null,
    };
  }

  // Domain → DTO (for update payload, only present fields)
  static toUpdateDto(payload: UpdateProviderRequest): UpdateProviderDto {
    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.taxId !== undefined && { tax_id: payload.taxId }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phone !== undefined && { phone: payload.phone ?? null }),
      ...(payload.address !== undefined && { address: payload.address ?? null }),
      ...(payload.contactPerson !== undefined && { contact_person: payload.contactPerson ?? null }),
      ...(payload.isActive !== undefined && { is_active: payload.isActive }),
    };
  }

  // Domain → DTO (for active flag payload)
  static toSetActiveDto(isActive: boolean): SetProviderActiveDto {
    return {
      is_active: isActive,
    };
  }

  // Page DTO → Domain
  static fromPageDto(dto: ProvidersPageDto): {
    data: Provider[];
    total: number;
  } {
    return {
      data: dto.items.map(ProviderMapper.fromDto),
      total: dto.total,
    };
  }

  // Products DTO → Domain
  static fromProductsDto(dto: ProviderProductsDto): ProviderProduct[] {
    return dto.items.map(ProviderMapper.productFromDto);
  }
}
