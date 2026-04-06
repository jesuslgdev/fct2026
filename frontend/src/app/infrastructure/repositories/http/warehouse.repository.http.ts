import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  WarehouseApiError,
  WarehouseAlreadyExistsError,
  WarehouseForbiddenError,
  WarehouseHasStockError,
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

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse`;
const WAREHOUSES_URL = `${BASE_URL}/warehouses`;

const WAREHOUSE_ERROR_CODES = {
  NAME_DUPLICATE: 6102,
  HAS_STOCK: 6103,
} as const;

@Injectable()
export class HttpWarehouseRepository implements WarehouseRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new WarehouseApiError();
    }

    const message = this.extractErrorMessage(err);
    const errorCode = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
      case 422:
        return new WarehouseValidationError(err.error, message ?? 'Validación fallida.');
      case 409:
        if (errorCode === WAREHOUSE_ERROR_CODES.NAME_DUPLICATE) {
          return new WarehouseAlreadyExistsError(message ?? 'Ya existe un almacén con este nombre.');
        }
        if (errorCode === WAREHOUSE_ERROR_CODES.HAS_STOCK) {
          return new WarehouseHasStockError(message ?? 'No se puede eliminar un almacén con stock existente.');
        }
        return new WarehouseApiError(message ?? 'Conflicto en la solicitud de almacenes.');
      case 401:
        return new WarehouseUnauthorizedError(message ?? 'Autenticación requerida.');
      case 403:
        return new WarehouseForbiddenError(message ?? 'Permisos insuficientes.');
      case 404:
        return new WarehouseNotFoundError(message ?? 'Almacén no encontrado.');
      default:
        return new WarehouseApiError(message ?? 'Error inesperado en la API de almacenes.');
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

  private extractErrorCode(err: HttpErrorResponse): number | undefined {
    if (!err.error || typeof err.error !== 'object') {
      return undefined;
    }

    const payload = err.error as Record<string, unknown>;
    const code = payload['error_code'];
    return typeof code === 'number' ? code : undefined;
  }

  getWarehouses(): Observable<WarehouseListResult> {
    return this.http.get<WarehouseDto[]>(WAREHOUSES_URL).pipe(
      map((response) => response.map(WarehouseMapper.fromDto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getWarehouseById(warehouseId: number): Observable<Warehouse> {
    return this.http.get<WarehouseDto>(`${WAREHOUSES_URL}/${warehouseId}`).pipe(
      map(WarehouseMapper.fromDto),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  createWarehouse(payload: CreateWarehousePayload): Observable<Warehouse> {
    return this.http.post<WarehouseDto>(WAREHOUSES_URL, WarehouseMapper.toCreateDto(payload)).pipe(
      map(WarehouseMapper.fromDto),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Observable<Warehouse> {
    return this.http.put<WarehouseDto>(`${WAREHOUSES_URL}/${warehouseId}`, WarehouseMapper.toUpdateDto(payload)).pipe(
      map(WarehouseMapper.fromDto),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  deleteWarehouse(warehouseId: number): Observable<void> {
    return this.http.delete<void>(`${WAREHOUSES_URL}/${warehouseId}`).pipe(
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }
}
