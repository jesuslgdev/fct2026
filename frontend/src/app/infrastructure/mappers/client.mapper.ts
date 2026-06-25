import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import {
  ClientDto,
  ClientAddressDto,
  CreateClientDto,
  UpdateClientDto,
  SetClientActiveDto,
  ClientsPageDto,
  ClientDetailDto,
} from '@infrastructure/dtos/client.dto';

export class ClientMapper {
  static fromDto(dto: ClientDto): Client {
    return {
      clientId: dto.client_id,
      name: dto.name,
      taxId: dto.tax_id,
      city: dto.city,
      isActive: dto.is_active,
    };
  }

  static fromDetailDto(dto: ClientDetailDto): ClientDetail {
    return {
      clientId: dto.client_id,
      name: dto.name,
      taxId: dto.tax_id,
      address: dto.address.street,
      city: dto.address.city,
      province: dto.address.province,
      postalCode: dto.address.postal_code,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.is_active,
    };
  }

  static toCreateDto(payload: CreateClientPayload): CreateClientDto {
    return {
      name: payload.name,
      tax_id: payload.taxId,
      address: {
        street: payload.address,
        city: payload.city,
        province: payload.province,
        postal_code: payload.postalCode,
      },
      phone: payload.phone,
      email: payload.email,
    };
  }

  static toUpdateDto(payload: UpdateClientPayload): UpdateClientDto {
    const hasCompleteAddress =
      payload.address !== undefined &&
      payload.address !== null &&
      payload.city !== undefined &&
      payload.city !== null &&
      payload.province !== undefined &&
      payload.province !== null &&
      payload.postalCode !== undefined &&
      payload.postalCode !== null;
    const address: ClientAddressDto | undefined = hasCompleteAddress
      ? {
          street: payload.address as string,
          city: payload.city as string,
          province: payload.province as string,
          postal_code: payload.postalCode as string,
        }
      : undefined;

    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(address !== undefined && { address }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.email !== undefined && { email: payload.email }),
    };
  }

  static toSetActiveDto(isActive: boolean): SetClientActiveDto {
    return { is_active: isActive };
  }

  static toQueryParams(params: ClientQueryParams): Record<string, string | number | boolean> {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      page_size: params.pageSize,
    };

    if (params.search !== undefined) {
      query['search'] = params.search;
    }

    if (params.isActive !== undefined) {
      query['active'] = params.isActive;
    }

    return query;
  }

  static fromPageDto(dto: ClientsPageDto): PagedResult<Client> {
    return {
      data: dto.items.map(ClientMapper.fromDto),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  }
}
