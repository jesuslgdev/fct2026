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

export class ProviderMapper {
  // DTO → Domain
  static fromDto(dto: ProviderDto): Provider {
    return {
<<<<<<< Updated upstream
      id: dto.provider_id.toString(),
=======
      id: dto.supplier_id.toString(),
      name: dto.name,
      taxId: dto.tax_id,
      email: '', // El endpoint lista no devuelve email
      phone: '', // El endpoint lista no devuelve phone
      address: '', // El endpoint lista no devuelve address
      province: '', // El endpoint lista no devuelve province
      postalCode: '', // El endpoint lista no devuelve postal_code
      contactPerson: undefined, // Backend no tiene contact_person
      isActive: dto.is_active,
      status: dto.is_active ? ProviderStatus.ACTIVE : ProviderStatus.INACTIVE,
      createdAt: new Date(), // Backend no proporciona timestamps en lista
      updatedAt: new Date(),
    };
  }

  // DTO Detail → Domain (detalle individual)
  static fromDetailDto(dto: ProviderDetailDto): Provider {
    return {
      id: dto.supplier_id.toString(),
>>>>>>> Stashed changes
      name: dto.name,
      taxId: dto.tax_id,
      email: dto.email,
      phone: dto.phone ?? undefined,
      address: dto.address ?? undefined,
      contactPerson: dto.contact_person ?? undefined,
      isActive: dto.is_active,
      status: dto.status,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }

  // Entidad auxiliar DTO → Domain
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

  // Domain → DTO (para crear)
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

  // Domain → DTO (para actualizar, solo campos presentes)
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

  // Domain → DTO (para paginación)
  static toSetActiveDto(isActive: boolean): SetProviderActiveDto {
    return {
      is_active: isActive,
    };
  }

  // DTO de página → Domain
  static fromPageDto(dto: ProvidersPageDto): {
    data: Provider[];
    total: number;
  } {
    return {
      data: dto.items.map(ProviderMapper.fromDto),
      total: dto.total,
    };
  }

  // DTO de productos → Domain
  static fromProductsDto(dto: ProviderProductsDto): ProviderProduct[] {
    return dto.items.map(ProviderMapper.productFromDto);
  }
}
