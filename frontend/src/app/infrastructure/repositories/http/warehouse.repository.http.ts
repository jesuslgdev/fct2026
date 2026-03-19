import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  WarehouseApiError,
  WarehouseForbiddenError,
  WarehouseNotFoundError,
  WarehouseUnauthorizedError,
  WarehouseValidationError,
} from '@domain/models/warehouse-errors';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';
import {
  WarehouseDto,
} from '@infrastructure/dtos/warehouse.dto';
import { WarehouseMapper } from '@infrastructure/mappers/warehouse.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/admin/warehouse`;

@Injectable()
export class HttpWarehouseRepository implements WarehouseRepository {
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
      return err instanceof Error ? err : new WarehouseApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new WarehouseValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new WarehouseUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new WarehouseForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new WarehouseNotFoundError(message ?? 'Warehouse not found.');
      default:
        return new WarehouseApiError(message ?? 'Unexpected warehouse API error.');
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

      if (typeof rawMessage === 'string' && rawMessage.trim()) {
        return rawMessage;
      }

      if (typeof rawDetail === 'string' && rawDetail.trim()) {
        return rawDetail;
      }
    }

    return undefined;
  }

  async getWarehouses(): Promise<WarehouseListResult> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get<WarehouseDto[]>(BASE_URL),
      );
      return response.map(WarehouseMapper.fromDto);
    });
  }

  async getWarehouseById(warehouseId: number): Promise<Warehouse> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<WarehouseDto>(`${BASE_URL}/${warehouseId}`));
      return WarehouseMapper.fromDto(dto);
    });
  }

  async getWarehouseByName(name: string): Promise<Warehouse | null> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get<WarehouseDto[]>(`${BASE_URL}?name=${encodeURIComponent(name)}`),
      );
      const warehouses = response.map(WarehouseMapper.fromDto);
      return warehouses.length > 0 ? warehouses[0] : null;
    });
  }

  async createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<WarehouseDto>(BASE_URL, WarehouseMapper.toCreateDto(payload)),
      );
      return WarehouseMapper.fromDto(dto);
    });
  }

  async updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Promise<Warehouse> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.put<WarehouseDto>(`${BASE_URL}/${warehouseId}`, WarehouseMapper.toUpdateDto(payload)),
      );
      return WarehouseMapper.fromDto(dto);
    });
  }

  async deleteWarehouse(warehouseId: number): Promise<void> {
    return this.withErrorMapping(async () => {
      await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${warehouseId}`));
    });
  }

  async getWarehouseTotalStock(warehouseId: number): Promise<number> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get<{ total_stock: number }>(`${BASE_URL}/${warehouseId}/total-stock`),
      );
      return response.total_stock;
    });
  }
}
