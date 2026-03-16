import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@domain/models/provider.model';
import { ProviderProduct } from '@domain/models/provider-product.model';
import {
  ProviderDto,
  ProviderDetailDto,
  CreateProviderDto,
  UpdateProviderDto,
  SetSupplierActiveDto,
  ProvidersPageDto,
  SupplierProductDto,
  ProviderProductDto,
  ProviderProductsDto,
} from '@infrastructure/dtos/provider.dto';
import { ProviderStatus } from '@domain/enums/provider-status.enum';

export class ProviderMapper {
  private static resolveProviderId(dto: ProviderDto): string {
    const rawId = dto.supplier_id ?? dto.provider_id;
    return (rawId ?? '').toString();
  }

  // DTO -> Domain (list)
  static fromDto(dto: ProviderDto): Provider {
    return {
      id: ProviderMapper.resolveProviderId(dto),
      name: dto.name,
      taxId: dto.tax_id,
      email: dto.email ?? '',
      phone: dto.phone ?? undefined,
      address: dto.address ?? undefined,
      province: dto.province ?? undefined,
      postalCode: dto.postal_code ?? undefined,
      contactPerson: dto.contact_person ?? undefined,
      isActive: dto.is_active,
      status: dto.status ?? (dto.is_active ? ProviderStatus.ACTIVE : ProviderStatus.INACTIVE),
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
  }

  // DTO detail -> Domain
  static fromDetailDto(dto: ProviderDetailDto): Provider {
    const provider = ProviderMapper.fromDto(dto);
    return {
      ...provider,
      products: dto.products?.map((product) => ProviderMapper.productFromSupplierDto(product, provider.id)) ?? [],
    };
  }

  private static productFromSupplierDto(dto: SupplierProductDto, providerId: string): ProviderProduct {
    return {
      id: (dto.id ?? dto.product_id).toString(),
      productId: dto.product_id.toString(),
      productName: dto.product_name ?? `Product ${dto.product_id}`,
      providerId,
      specificPrice: Number(dto.supplier_price),
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
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

  // Domain -> DTO (create payload)
  static toCreateDto(payload: CreateProviderRequest): CreateProviderDto {
    return {
      name: payload.name,
      tax_id: payload.taxId,
      email: payload.email,
      phone: payload.phone ?? '',
      address: payload.address ?? '',
      province: payload.province ?? '',
      city: '', // Backend requires city but UI does not currently expose it
      postal_code: payload.postalCode ?? '',
    };
  }

  // Domain -> DTO (update payload)
  static toUpdateDto(payload: UpdateProviderRequest): UpdateProviderDto {
    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.address !== undefined && { address: payload.address }),
      ...(payload.province !== undefined && { province: payload.province }),
      ...(payload.postalCode !== undefined && { postal_code: payload.postalCode }),
      // Note: Backend does not allow tax_id updates
      // Note: Backend does not expose contact_person
    };
  }

  // Domain -> DTO (activate/deactivate payload)
  static toSetActiveDto(isActive: boolean): SetSupplierActiveDto {
    return {
      is_active: isActive,
    };
  }

  // Page DTO -> Domain
  static fromPageDto(dto: ProvidersPageDto): {
    data: Provider[];
    total: number;
  } {
    return {
      data: dto.items.map(ProviderMapper.fromDto),
      total: dto.total,
    };
  }

  // Products DTO -> Domain
  static fromProductsDto(dto: ProviderProductsDto): ProviderProduct[] {
    return dto.items.map(ProviderMapper.productFromDto);
  }
}
