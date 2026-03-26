import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  ClientAlreadyExistsError,
  ClientApiError,
  ClientForbiddenError,
  ClientNotFoundError,
  ClientUnauthorizedError,
  ClientValidationError,
} from '@domain/models/client-errors';
import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import {
  SetClientActiveDto,
  ClientsPageDto,
  ClientDetailDto,
} from '@infrastructure/dtos/client.dto';
import { ClientMapper } from '@infrastructure/mappers/client.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/clients`;

@Injectable()
export class HttpClientRepository implements ClientRepository {
  private readonly http = inject(HttpClient);

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
        return new ClientAlreadyExistsError(message ?? 'A client with this tax ID already exists.');
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

  getClients(params: ClientQueryParams): Observable<PagedResult<Client>> {
    const query = ClientMapper.toQueryParams(params);
    return this.http.get<ClientsPageDto>(BASE_URL, { params: query }).pipe(
      map((response) => ClientMapper.fromPageDto(response)),
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  getClientById(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetailDto>(`${BASE_URL}/${id}`).pipe(
      map((dto) => ClientMapper.fromDetailDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  createClient(payload: CreateClientPayload): Observable<ClientDetail> {
    return this.http
      .post<ClientDetailDto>(BASE_URL, ClientMapper.toCreateDto(payload))
      .pipe(
        map((dto) => ClientMapper.fromDetailDto(dto)),
        catchError((err) => throwError(() => this.mapHttpError(err))),
      );
  }

  updateClient(id: number, payload: UpdateClientPayload): Observable<ClientDetail> {
    return this.http
      .put<ClientDetailDto>(`${BASE_URL}/${id}`, ClientMapper.toUpdateDto(payload))
      .pipe(
        map((dto) => ClientMapper.fromDetailDto(dto)),
        catchError((err) => throwError(() => this.mapHttpError(err))),
      );
  }

  toggleClientStatus(id: number, isActive: boolean): Observable<void> {
    const body: SetClientActiveDto = ClientMapper.toSetActiveDto(isActive);
    return this.http.patch<void>(`${BASE_URL}/${id}/active`, body).pipe(
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }
}
