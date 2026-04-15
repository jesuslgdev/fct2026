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
  SupplierAddressDto,
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

  private static resolveAddress(dto: ProviderDto): SupplierAddressDto | null {
    if (dto.address && typeof dto.address === 'object') {
      return dto.address;
    }

    const legacyStreet = typeof dto.address === 'string' ? dto.address : null;
    const legacyCity = typeof dto.city === 'string' ? dto.city : null;
    const legacyProvince = typeof dto.province === 'string' ? dto.province : null;
    const legacyPostalCode = typeof dto.postal_code === 'string' ? dto.postal_code : null;

    const hasLegacyFlatAddress =
      legacyStreet !== null &&
      legacyCity !== null &&
      legacyProvince !== null &&
      legacyPostalCode !== null;

    if (!hasLegacyFlatAddress) {
      return null;
    }

    return {
      street: legacyStreet,
      city: legacyCity,
      province: legacyProvince,
      postal_code: legacyPostalCode,
    };
  }

  // DTO -> Domain (list)
  static fromDto(dto: ProviderDto): Provider {
    const isActive = dto.is_active ?? false;
    const resolvedAddress = ProviderMapper.resolveAddress(dto);

    return {
      id: ProviderMapper.resolveProviderId(dto),
      name: dto.name ?? '',
      taxId: dto.tax_id ?? '',
      email: dto.email ?? '',
      phone: dto.phone ?? undefined,
      address: resolvedAddress?.street ?? (typeof dto.address === 'string' ? dto.address : undefined),
      city: resolvedAddress?.city ?? dto.city ?? undefined,
      province: resolvedAddress?.province ?? dto.province ?? undefined,
      postalCode: resolvedAddress?.postal_code ?? dto.postal_code ?? undefined,
      isActive,
      status: dto.status ?? (isActive ? ProviderStatus.ACTIVE : ProviderStatus.INACTIVE),
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
      id: dto.id?.toString() ?? '',
      productId: dto.product_id?.toString() ?? '',
      productName: dto.product_name ?? '',
      providerId: dto.provider_id?.toString() ?? '',
      specificPrice: dto.specific_price ?? 0,
      createdAt: new Date(dto.created_at ?? new Date()),
      updatedAt: new Date(dto.updated_at ?? new Date()),
    };
  }

  // Domain -> DTO (create payload)
  static toCreateDto(payload: CreateProviderRequest): CreateProviderDto {
    return {
      name: payload.name,
      tax_id: payload.taxId,
      email: payload.email,
      phone: payload.phone ?? '',
      address: {
        street: payload.address ?? '',
        city: payload.city ?? '',
        province: payload.province ?? '',
        postal_code: payload.postalCode ?? '',
      },
    };
  }

  // Domain -> DTO (update payload)
  static toUpdateDto(payload: UpdateProviderRequest): UpdateProviderDto {
    const hasAddressUpdate =
      typeof payload.address === 'string' && payload.address.trim().length > 0 &&
      typeof payload.city === 'string' && payload.city.trim().length > 0 &&
      typeof payload.province === 'string' && payload.province.trim().length > 0 &&
      typeof payload.postalCode === 'string' && payload.postalCode.trim().length > 0;

    const addressPayload: SupplierAddressDto | undefined = hasAddressUpdate
      ? {
          street: payload.address as string,
          city: payload.city as string,
          province: payload.province as string,
          postal_code: payload.postalCode as string,
        }
      : undefined;

    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(addressPayload !== undefined && { address: addressPayload }),
      // Note: Backend does not allow tax_id updates
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
