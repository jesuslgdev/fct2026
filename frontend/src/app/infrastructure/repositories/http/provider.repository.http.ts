import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProviderRepository } from '@domain/repositories/provider.repository';
import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@domain/models/provider.model';
import { PageEvent } from '@domain/models/page-event.model';
import {
  ProviderDto,
  SetProviderActiveDto,
  ProvidersPageDto,
  ProviderProductsDto,
} from '@infrastructure/dtos/provider.dto';
import { ProviderMapper } from '@infrastructure/mappers/provider.mapper';
import { environment } from 'environments/environment';

// TODO add base url for API REST
const BASE_URL = `${environment.apiUrl}/api/v1/providers`;

@Injectable()
export class HttpProviderRepository implements ProviderRepository {
  private readonly http = inject(HttpClient);

  // ── Error mapping centralizado ─────────────────────────────────────────
  private async withErrorMapping<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err);
    }
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new Error('Unexpected error occurred');
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new Error(message ?? 'Validation failed.');
      case 401:
        return new Error(message ?? 'Authentication required.');
      case 403:
        return new Error(message ?? 'Insufficient permissions.');
      case 404:
        return new Error(message ?? 'Provider not found.');
      default:
        return new Error(message ?? 'Unexpected API error.');
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

  // ── Operaciones CRUD ───────────────────────────────────────────────────
  async getProviders(pageEvent?: PageEvent): Promise<{
    data: Provider[];
    total: number;
  }> {
    return this.withErrorMapping(async () => {
      const query: Record<string, string | number | boolean> = {};
      
      if (pageEvent?.first !== undefined) query['first'] = pageEvent.first;
      if (pageEvent?.rows !== undefined) query['rows'] = pageEvent.rows;
      if (pageEvent?.page !== undefined) query['page'] = pageEvent.page;

      const response = await firstValueFrom(
        this.http.get<ProvidersPageDto>(BASE_URL, { params: query }),
      );

      return ProviderMapper.fromPageDto(response);
    });
  }

  async getProviderById(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<ProviderDto>(`${BASE_URL}/${id}`));
      return ProviderMapper.fromDto(dto);
    });
  }

  async createProvider(provider: CreateProviderRequest): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<ProviderDto>(BASE_URL, ProviderMapper.toCreateDto(provider)),
      );
      return ProviderMapper.fromDto(dto);
    });
  }

  async updateProvider(id: string, provider: UpdateProviderRequest): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.patch<ProviderDto>(`${BASE_URL}/${id}`, ProviderMapper.toUpdateDto(provider)),
      );
      return ProviderMapper.fromDto(dto);
    });
  }

  async activateProvider(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const body: SetProviderActiveDto = ProviderMapper.toSetActiveDto(true);
      const dto = await firstValueFrom(
        this.http.patch<ProviderDto>(`${BASE_URL}/${id}/activate`, body),
      );
      return ProviderMapper.fromDto(dto);
    });
  }

  async deactivateProvider(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const body: SetProviderActiveDto = ProviderMapper.toSetActiveDto(false);
      const dto = await firstValueFrom(
        this.http.patch<ProviderDto>(`${BASE_URL}/${id}/deactivate`, body),
      );
      return ProviderMapper.fromDto(dto);
    });
  }

  async getProviderProducts(providerId: string): Promise<Provider[]> {
    return this.withErrorMapping(async () => {
      // TODO: replace with ProductRepository when Products feature becomes available
      const dto = await firstValueFrom(
        this.http.get<ProviderProductsDto>(`${BASE_URL}/${providerId}/products`),
      );
      
      // For now, return the provider with products attached
      const provider = await firstValueFrom(this.http.get<ProviderDto>(`${BASE_URL}/${providerId}`));
      const providerWithProducts = {
        ...ProviderMapper.fromDto(provider),
        products: ProviderMapper.fromProductsDto(dto),
      };
      
      return [providerWithProducts];
    });
  }
}
