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
      address: dto.address,
      city: dto.city,
      province: dto.province,
      postalCode: dto.postal_code,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.is_active,
    };
  }

  static toCreateDto(payload: CreateClientPayload): CreateClientDto {
    return {
      name: payload.name,
      tax_id: payload.taxId,
      address: payload.address,
      city: payload.city,
      province: payload.province,
      postal_code: payload.postalCode,
      phone: payload.phone,
      email: payload.email,
    };
  }

  static toUpdateDto(payload: UpdateClientPayload): UpdateClientDto {
    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.address !== undefined && { address: payload.address }),
      ...(payload.city !== undefined && { city: payload.city }),
      ...(payload.province !== undefined && { province: payload.province }),
      ...(payload.postalCode !== undefined && { postal_code: payload.postalCode }),
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
