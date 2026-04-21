import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  SaleApiError,
  SaleClientNotActiveError,
  SaleClientNotFoundError,
  SaleEmptyLinesError,
  SaleForbiddenError,
  SaleInsufficientStockError,
  SaleNotFoundError,
  SaleProductNotActiveError,
  SaleProductNotFoundError,
  SaleUnauthorizedError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { CreateSale, ListSalesFilters, PagedResult, Sale, SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { SaleDetailDTO, SalesPageDto } from '@infrastructure/dtos/sale.dto';
import { SaleMapper } from '@infrastructure/mappers/sale.mapper';
import { environment } from 'environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';

const BASE_URL = `${environment.apiUrl}/api/v1/sales`;

const SALE_ERROR_CODES = {
  SALE_NOT_FOUND: 8101,
  CLIENT_NOT_FOUND: 8102,
  CLIENT_NOT_ACTIVE: 8103,
  PRODUCT_NOT_FOUND: 8104,
  PRODUCT_NOT_ACTIVE: 8105,
  INSUFFICIENT_STOCK: 8106,
  EMPTY_LINES: 8107,
} as const;

@Injectable()
export class HttpSaleRepository implements SaleRepository {
  private readonly http = inject(HttpClient);

  private withErrorMapping<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  list(filters: ListSalesFilters): Observable<PagedResult<Sale>> {
    return this.withErrorMapping(() =>
      this.http
        .get<SalesPageDto>(BASE_URL, { params: this.toQueryParams(filters) })
        .pipe(map((response) => SaleMapper.toPagedResult(response, filters)))
    );
  }

  getById(id: number): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http.get<SaleDetailDTO>(`${BASE_URL}/${id}`).pipe(map((dto) => SaleMapper.toDetailDomain(dto)))
    );
  }

  create(data: CreateSale): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http.post<SaleDetailDTO>(BASE_URL, SaleMapper.toRequest(data)).pipe(map((dto) => SaleMapper.toDetailDomain(dto)))
    );
  }

  private toQueryParams(filters: ListSalesFilters): HttpParams {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('page_size', String(filters.pageSize));

    if (filters.sortField) {
      params = params.set('sort_field', filters.sortField);
    }

    if (filters.sortOrder) {
      params = params.set('sort_order', filters.sortOrder);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.clientId !== undefined) {
      params = params.set('client_id', String(filters.clientId));
    }

    if (filters.dateFrom) {
      params = params.set('date_from', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      params = params.set('date_to', filters.dateTo.toISOString());
    }

    return params;
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new SaleApiError();
    }

    const message = this.extractErrorMessage(err);
    const errorCode = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
      case 422:
        if (errorCode === SALE_ERROR_CODES.EMPTY_LINES) {
          return new SaleEmptyLinesError(message ?? 'At least one sale line is required.');
        }
        return new SaleValidationError(err.error, message ?? 'Sale validation failed.');
      case 401:
        return new SaleUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new SaleForbiddenError(message ?? 'Insufficient permissions to manage sales.');
      case 404:
        if (errorCode === SALE_ERROR_CODES.CLIENT_NOT_FOUND) {
          return new SaleClientNotFoundError(message ?? 'Client not found.');
        }
        if (errorCode === SALE_ERROR_CODES.PRODUCT_NOT_FOUND) {
          return new SaleProductNotFoundError(message ?? 'One or more products were not found.');
        }
        return new SaleNotFoundError(message ?? 'Sale not found.');
      case 409:
        if (errorCode === SALE_ERROR_CODES.CLIENT_NOT_ACTIVE) {
          return new SaleClientNotActiveError(message ?? 'Client is not active and cannot receive sales.');
        }
        if (errorCode === SALE_ERROR_CODES.PRODUCT_NOT_ACTIVE) {
          return new SaleProductNotActiveError(message ?? 'One or more products are inactive.');
        }
        if (errorCode === SALE_ERROR_CODES.INSUFFICIENT_STOCK) {
          return new SaleInsufficientStockError(message ?? 'Insufficient stock for one or more products.');
        }
        return new SaleApiError(message ?? 'Sales request conflict.');
      default:
        return new SaleApiError(message ?? 'Unexpected sales API error.');
    }
  }

  private extractErrorCode(err: HttpErrorResponse): number | undefined {
    if (!err.error || typeof err.error !== 'object') {
      return undefined;
    }

    const payload = err.error as Record<string, unknown>;
    const code = payload['error_code'];
    return typeof code === 'number' ? code : undefined;
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
}
