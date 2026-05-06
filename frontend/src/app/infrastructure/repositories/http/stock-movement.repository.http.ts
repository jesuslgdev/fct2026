import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { StockMovementRepository } from '@domain/repositories/stock-movement.repository';
import {
  StockMovement,
  StockMovementDetail,
  ListStockMovementsPayload,
} from '@domain/models/stock-movement.model';
import {
  StockMovementApiError,
  StockMovementForbiddenError,
  StockMovementNotFoundError,
  StockMovementUnauthorizedError,
  StockMovementValidationError,
} from '@domain/models/stock-movement-errors';
import { PagedResult } from '@domain/models/paged-result.model';
import { StockMovementItemDto, StockMovementDetailDto } from '@infrastructure/dtos/stock-movement.dto';
import { StockMovementMapper } from '@infrastructure/mappers/stock-movement.mapper';
import { PaginatedResponse } from '@infrastructure/dtos/paginated-response.dto';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse/stock/movements`;

@Injectable()
export class HttpStockMovementRepository implements StockMovementRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new StockMovementApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422: {
        const field =
          typeof err.error === 'object' && err.error !== null
            ? ((err.error as Record<string, unknown>)['field'] as string) ?? 'validation'
            : 'validation';
        return new StockMovementValidationError(field, message ?? 'Validation failed.');
      }
      case 401:
        return new StockMovementUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new StockMovementForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new StockMovementNotFoundError(message ?? 'Stock movement not found.');
      default:
        return new StockMovementApiError(message ?? 'Unexpected stock movements API error.');
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

  listMovements(
    payload: ListStockMovementsPayload,
    page: number,
    pageSize: number,
  ): Observable<PagedResult<StockMovement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (payload.productId != null) {
      params = params.set('product_id', payload.productId.toString());
    }
    if (payload.movementType != null) {
      params = params.set('movement_type', payload.movementType);
    }
    if (payload.dateFrom != null) {
      const startOfDay = new Date(payload.dateFrom);
      startOfDay.setHours(0, 0, 0, 0);
      params = params.set('date_from', startOfDay.toISOString());
    }
    if (payload.dateTo != null) {
      const endOfDay = new Date(payload.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      params = params.set('date_to', endOfDay.toISOString());
    }
    if (payload.reasonSearch?.trim()) {
      params = params.set('reason_search', payload.reasonSearch.trim());
    }

    return this.http.get<PaginatedResponse<StockMovementItemDto>>(BASE_URL, { params }).pipe(
      map((response) => ({
        data: response.items.map(StockMovementMapper.fromDto),
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
      })),
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  getMovementById(movementId: number): Observable<StockMovementDetail> {
    return this.http.get<StockMovementDetailDto>(`${BASE_URL}/${movementId}`).pipe(
      map(StockMovementMapper.fromDetailDto),
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }
}
