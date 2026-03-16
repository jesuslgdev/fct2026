import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  ClientApiError,
  ClientForbiddenError,
  ClientNotFoundError,
  ClientUnauthorizedError,
  ClientValidationError,
} from '@domain/models/client-errors';
import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import {
  ClientDto,
  SetClientActiveDto,
  ClientsPageDto,
} from '@infrastructure/dtos/client.dto';
import { ClientMapper } from '@infrastructure/mappers/client.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/clients`;

@Injectable()
export class HttpClientRepository implements ClientRepository {
  private readonly http = inject(HttpClient);

  private async withErrorMapping<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err);
    }
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new ClientApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new ClientValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new ClientUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new ClientForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new ClientNotFoundError(message ?? 'Client not found.');
      case 409:
        return new ClientApiError(message ?? 'A client with this tax ID already exists.');
      default:
        return new ClientApiError(message ?? 'Unexpected clients API error.');
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string | undefined {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    if (err.error && typeof err.error === 'object') {
      const payload = err.error as Record<string, unknown>;
      const rawMessage = payload['message'];
      const rawDetail = payload['detail'];
      if (typeof rawMessage === 'string' && rawMessage.trim()) return rawMessage;
      if (typeof rawDetail === 'string' && rawDetail.trim()) return rawDetail;
    }
    return undefined;
  }

  async getClients(params: ClientQueryParams): Promise<PagedResult<Client>> {
    return this.withErrorMapping(async () => {
      const query = ClientMapper.toQueryParams(params);
      const response = await firstValueFrom(
        this.http.get<ClientsPageDto>(BASE_URL, { params: query }),
      );
      return ClientMapper.fromPageDto(response);
    });
  }

  async getClientById(id: number): Promise<Client> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<ClientDto>(`${BASE_URL}/${id}`));
      return ClientMapper.fromDto(dto);
    });
  }

  async createClient(payload: CreateClientPayload): Promise<Client> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<ClientDto>(BASE_URL, ClientMapper.toCreateDto(payload)),
      );
      return ClientMapper.fromDto(dto);
    });
  }

  async updateClient(id: number, payload: UpdateClientPayload): Promise<Client> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.patch<ClientDto>(`${BASE_URL}/${id}`, ClientMapper.toUpdateDto(payload)),
      );
      return ClientMapper.fromDto(dto);
    });
  }

  async toggleClientStatus(id: number, isActive: boolean): Promise<void> {
    return this.withErrorMapping(async () => {
      const body: SetClientActiveDto = ClientMapper.toSetActiveDto(isActive);
      await firstValueFrom(this.http.patch<void>(`${BASE_URL}/${id}/active`, body));
    });
  }
}
