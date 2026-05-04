import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from '@domain/models/supplier.model';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import {
  SupplierDto,
  SupplierDetailDto,
  SupplierDetailProductDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierAddressDto,
  SetSupplierActiveDto,
  SuppliersPageDto,
  SupplierProductDto,
  SupplierProductsDto,
} from '@infrastructure/dtos/supplier.dto';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';

export class SupplierMapper {
  private static resolveSupplierId(dto: SupplierDto): string {
    const rawId = dto.supplier_id ?? dto.provider_id;
    return (rawId ?? '').toString();
  }

  private static resolveAddress(dto: SupplierDto): SupplierAddressDto | null {
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
  static fromDto(dto: SupplierDto): Supplier {
    const isActive = dto.is_active ?? false;
    const resolvedAddress = SupplierMapper.resolveAddress(dto);

    return {
      id: SupplierMapper.resolveSupplierId(dto),
      name: dto.name ?? '',
      taxId: dto.tax_id ?? '',
      email: dto.email ?? '',
      phone: dto.phone ?? undefined,
      address: resolvedAddress?.street ?? (typeof dto.address === 'string' ? dto.address : undefined),
      city: resolvedAddress?.city ?? dto.city ?? undefined,
      province: resolvedAddress?.province ?? dto.province ?? undefined,
      postalCode: resolvedAddress?.postal_code ?? dto.postal_code ?? undefined,
      isActive,
      status: dto.status ?? (isActive ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE),
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
  }

  // DTO detail -> Domain
  static fromDetailDto(dto: SupplierDetailDto): Supplier {
    const supplier = SupplierMapper.fromDto(dto);
    return {
      ...supplier,
      products: dto.products?.map((product) => SupplierMapper.productFromDetailDto(product, supplier.id)) ?? [],
    };
  }

  private static productFromDetailDto(dto: SupplierDetailProductDto, supplierId: string): SupplierProduct {
    return {
      id: (dto.id ?? dto.product_id).toString(),
      productId: dto.product_id.toString(),
      productName: dto.product_name ?? `Product ${dto.product_id}`,
      supplierId,
      specificPrice: Number(dto.supplier_price),
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
  }

  // Helper entity DTO -> Domain
  static productFromDto(dto: SupplierProductDto): SupplierProduct {
    return {
      id: dto.id?.toString() ?? '',
      productId: dto.product_id?.toString() ?? '',
      productName: dto.product_name ?? '',
      supplierId: dto.provider_id?.toString() ?? '',
      specificPrice: dto.specific_price ?? 0,
      createdAt: new Date(dto.created_at ?? new Date()),
      updatedAt: new Date(dto.updated_at ?? new Date()),
    };
  }

  // Domain -> DTO (create payload)
  static toCreateDto(payload: CreateSupplierRequest): CreateSupplierDto {
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
  static toUpdateDto(payload: UpdateSupplierRequest): UpdateSupplierDto {
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
  static fromPageDto(dto: SuppliersPageDto): {
    data: Supplier[];
    total: number;
  } {
    return {
      data: dto.items.map(SupplierMapper.fromDto),
      total: dto.total,
    };
  }

  // Products DTO -> Domain
  static fromProductsDto(dto: SupplierProductsDto): SupplierProduct[] {
    return dto.items.map(SupplierMapper.productFromDto);
  }
}

