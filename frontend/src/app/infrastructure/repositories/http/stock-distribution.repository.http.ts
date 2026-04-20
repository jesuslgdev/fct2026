import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { StockDistributionRepository } from '@domain/repositories/stock-distribution.repository';
import {
  AdjustStockPayload,
  AdjustStockResult,
  StockDistributionFilters,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import {
  ProductNotActiveError,
  ProductNotFoundError,
  StockDistributionApiError,
  StockDistributionNotFoundError,
  StockDistributionValidationError,
  WarehouseNotFoundError,
} from '@domain/models/stock-distribution-errors';
import {
  AdjustStockResponseDto,
  StockDistributionPageDto,
} from '@infrastructure/dtos/stock-distribution.dto';
import { StockDistributionMapper } from '@infrastructure/mappers/stock-distribution.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse/stock`;
const ADJUST_STOCK_URL = `${BASE_URL}/adjust`;

const STOCK_DISTRIBUTION_ERROR_CODES = {
  WAREHOUSE_NOT_FOUND: 6101,
  PRODUCT_NOT_FOUND: 6201,
  PRODUCT_NOT_ACTIVE: 6204,
} as const;

@Injectable()
export class HttpStockDistributionRepository implements StockDistributionRepository {
  private readonly http = inject(HttpClient);

  private withErrorMapping<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new StockDistributionApiError();
    }

    const message = this.extractErrorMessage(err);
    const errorCode = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
      case 422:
        return new StockDistributionValidationError(
          err.error,
          message ?? 'Stock distribution validation failed.',
        );
      case 404:
        if (errorCode === STOCK_DISTRIBUTION_ERROR_CODES.WAREHOUSE_NOT_FOUND) {
          return new WarehouseNotFoundError(message ?? 'Warehouse not found.');
        }
        if (errorCode === STOCK_DISTRIBUTION_ERROR_CODES.PRODUCT_NOT_FOUND) {
          return new ProductNotFoundError(message ?? 'Product not found.');
        }
        return new StockDistributionNotFoundError(
          message ?? 'Stock distribution record not found.',
        );
      case 409:
        if (errorCode === STOCK_DISTRIBUTION_ERROR_CODES.PRODUCT_NOT_ACTIVE) {
          return new ProductNotActiveError(message ?? 'Product is not active.');
        }
        return new StockDistributionApiError(
          message ?? 'Conflict in stock distribution request.',
        );
      default:
        return new StockDistributionApiError(
          message ?? 'Unexpected error in stock distribution API.',
        );
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
    const rawCode = payload['error_code'];
    return typeof rawCode === 'number' ? rawCode : undefined;
  }

  getStockDistribution(
    filters: StockDistributionFilters,
  ): Observable<StockDistributionListResult> {
    return this.withErrorMapping(() =>
      this.http
        .get<StockDistributionPageDto>(BASE_URL, {
          params: StockDistributionMapper.toQueryParams(filters),
        })
        .pipe(map((response) => StockDistributionMapper.fromPageDto(response))),
    );
  }

  adjustStock(payload: AdjustStockPayload): Observable<AdjustStockResult> {
    return this.withErrorMapping(() =>
      this.http
        .post<AdjustStockResponseDto>(
          ADJUST_STOCK_URL,
          StockDistributionMapper.toAdjustStockDto(payload),
        )
        .pipe(
          map((response) =>
            StockDistributionMapper.fromAdjustStockResponseDto(response),
          ),
        ),
    );
  }
}
