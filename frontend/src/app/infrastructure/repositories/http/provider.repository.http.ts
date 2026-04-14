import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProviderRepository } from '@domain/repositories/provider.repository';
import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderImportExecutionResult,
  ProviderImportTemplate,
} from '@domain/models/provider.model';
import { PageEvent } from '@domain/models/page-event.model';
import {
  ProviderDetailDto,
  SetSupplierActiveDto,
  ProvidersPageDto,
  ProviderProductsDto,
} from '@infrastructure/dtos/provider.dto';
import { ProviderMapper } from '@infrastructure/mappers/provider.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/suppliers`;

interface ImportProvidersApiResponse {
  total: number;
  created: number;
  errors: number;
  error_detail: { row: number; reason: string }[];
}

@Injectable()
export class HttpProviderRepository implements ProviderRepository {
  private readonly http = inject(HttpClient);

  // ── Centralized error mapping ──────────────────────────────────────────
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

  // ── CRUD operations ────────────────────────────────────────────────────
  async getProviders(pageEvent?: PageEvent): Promise<{
    data: Provider[];
    total: number;
  }> {
    return this.withErrorMapping(async () => {
      const query: Record<string, string | number | boolean> = {};

      // Backend uses page_size instead of rows.
      if (pageEvent?.page !== undefined) query['page'] = pageEvent.page;
      if (pageEvent?.rows !== undefined) query['page_size'] = pageEvent.rows;
      if (pageEvent?.query) {
        // Keep both names for backend compatibility during migration.
        query['search'] = pageEvent.query;
        query['q'] = pageEvent.query;
      }
      if (pageEvent?.status) query['status'] = pageEvent.status;
      if (pageEvent?.isActive !== undefined) query['is_active'] = pageEvent.isActive;

      const response = await firstValueFrom(
        this.http.get<ProvidersPageDto>(BASE_URL, { params: query }),
      );

      return ProviderMapper.fromPageDto(response);
    });
  }

  async getProviderById(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<ProviderDetailDto>(`${BASE_URL}/${id}`));
      return ProviderMapper.fromDetailDto(dto);
    });
  }

  async createProvider(provider: CreateProviderRequest): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<ProviderDetailDto>(BASE_URL, ProviderMapper.toCreateDto(provider)),
      );
      return ProviderMapper.fromDetailDto(dto);
    });
  }

  async updateProvider(id: string, provider: UpdateProviderRequest): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.put<ProviderDetailDto>(`${BASE_URL}/${id}`, ProviderMapper.toUpdateDto(provider)),
      );
      return ProviderMapper.fromDetailDto(dto);
    });
  }

  async activateProvider(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const body: SetSupplierActiveDto = ProviderMapper.toSetActiveDto(true);
      const response = await firstValueFrom(
        this.http.patch<ProviderDetailDto | null>(`${BASE_URL}/${id}/active`, body),
      );
      
      // If backend returns 204 No Content, reload provider details.
      if (!response) {
        return await this.getProviderById(id);
      }
      
      return ProviderMapper.fromDetailDto(response);
    });
  }

  async deactivateProvider(id: string): Promise<Provider> {
    return this.withErrorMapping(async () => {
      const body: SetSupplierActiveDto = ProviderMapper.toSetActiveDto(false);
      const response = await firstValueFrom(
        this.http.patch<ProviderDetailDto | null>(`${BASE_URL}/${id}/active`, body),
      );
      
      // If backend returns 204 No Content, reload provider details.
      if (!response) {
        return await this.getProviderById(id);
      }
      
      return ProviderMapper.fromDetailDto(response);
    });
  }

  async getProviderProducts(providerId: string): Promise<Provider[]> {
    return this.withErrorMapping(async () => {
      // The detail endpoint may already include products depending on backend version.
      const detailDto = await firstValueFrom(
        this.http.get<ProviderDetailDto>(`${BASE_URL}/${providerId}`),
      );

      const providerFromDetail = ProviderMapper.fromDetailDto(detailDto);
      if ((providerFromDetail.products?.length ?? 0) > 0) {
        return [providerFromDetail];
      }

      // Backward compatibility: older backend versions expose products in /products.
      try {
        const productsDto = await firstValueFrom(
          this.http.get<ProviderProductsDto>(`${BASE_URL}/${providerId}/products`),
        );

        return [
          {
            ...providerFromDetail,
            products: ProviderMapper.fromProductsDto(productsDto),
          },
        ];
      } catch {
        return [providerFromDetail];
      }
    });
  }

  async downloadImportTemplate(): Promise<ProviderImportTemplate> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get(`${BASE_URL}/template`, {
          responseType: 'blob',
        }),
      );

      return {
        filename: 'plantilla_proveedores.xlsx',
        data: await response.arrayBuffer(),
      };
    });
  }

  async importProviders(file: File): Promise<ProviderImportExecutionResult> {
    return this.withErrorMapping(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await firstValueFrom(
        this.http.post<ImportProvidersApiResponse>(`${BASE_URL}/import`, formData),
      );

      const errors = (response.error_detail ?? []).map((error) => ({
        row: error.row,
        reason: error.reason,
      }));

      return {
        success: response.errors === 0,
        importedCount: response.created,
        message: response.errors === 0
          ? `Se han importado ${response.created} proveedores correctamente`
          : `Se encontraron ${response.errors} errores durante la importación`,
        errors: errors.length > 0 ? errors : undefined,
      };
    });
  }
}
