import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  ListSalesFilters,
  PagedResult,
  Sale,
  SaleDetail,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
import {
  SaleApiError,
  SaleClientNotActiveError,
  SaleClientNotFoundError,
  SaleDeliveryAddressRequiredError,
  SaleEmptyLinesError,
  SaleForbiddenError,
  SaleInsufficientStockError,
  SaleInvalidDiscountError,
  SaleInvalidStatusTransitionError,
  SaleLineNotFoundError,
  SaleMinimumOneLineError,
  SaleNotDeletableError,
  SaleNotFoundError,
  SaleNotPendingError,
  SaleProductNotActiveError,
  SaleProductNotFoundError,
  SaleTerminalStateError,
  SaleUnauthorizedError,
  SaleValidationError,
  SaleWarehouseNotFoundError,
} from '@domain/models/sale-errors';
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
  INVALID_STATUS_TRANSITION: 8108,
  TERMINAL_STATE: 8109,
  WAREHOUSE_NOT_FOUND: 8110,
  NOT_PENDING: 8111,
  DELIVERY_ADDRESS_REQUIRED: 8112,
  AMBIGUOUS_NOT_DELETABLE_OR_INVALID_DISCOUNT: 8113,
  SALE_LINE_NOT_FOUND: 8114,
  MINIMUM_ONE_LINE: 8115,
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
        .get<SalesPageDto>(BASE_URL, {
          params: SaleMapper.toQueryParams(filters),
        })
        .pipe(map((response) => SaleMapper.fromPageDto(response)))
    );
  }

  getById(id: number): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .get<SaleDetailDTO>(`${BASE_URL}/${id}`)
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  create(data: CreateSale): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .post<SaleDetailDTO>(BASE_URL, SaleMapper.toCreateDto(data))
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  update(saleId: number, data: UpdateSale): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .put<SaleDetailDTO>(`${BASE_URL}/${saleId}`, SaleMapper.toUpdateDto(data))
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  cancel(saleId: number): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .patch<SaleDetailDTO>(
          `${BASE_URL}/${saleId}/status`,
          SaleMapper.toAdvanceStatusDto({ newStatus: SaleStatus.CANCELLED })
        )
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  delete(saleId: number): Observable<void> {
    return this.withErrorMapping(() =>
      this.http.delete<void>(`${BASE_URL}/${saleId}`).pipe(map(() => undefined))
    );
  }

  addLine(saleId: number, data: AddSaleLine): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .post<SaleDetailDTO>(
          `${BASE_URL}/${saleId}/lines`,
          SaleMapper.toAddLineDto(data)
        )
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  updateLine(
    saleId: number,
    saleLineId: number,
    data: UpdateSaleLine
  ): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .put<SaleDetailDTO>(
          `${BASE_URL}/${saleId}/lines/${saleLineId}`,
          SaleMapper.toUpdateLineDto(data)
        )
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  removeLine(saleId: number, saleLineId: number): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .delete<SaleDetailDTO>(`${BASE_URL}/${saleId}/lines/${saleLineId}`)
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
  }

  advanceStatus(saleId: number, data: AdvanceSaleStatus): Observable<SaleDetail> {
    return this.withErrorMapping(() =>
      this.http
        .patch<SaleDetailDTO>(
          `${BASE_URL}/${saleId}/status`,
          SaleMapper.toAdvanceStatusDto(data)
        )
        .pipe(map((dto) => SaleMapper.fromDetailDto(dto)))
    );
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
        return this.mapBusinessOrValidationError(errorCode, err, message);
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
        if (errorCode === SALE_ERROR_CODES.WAREHOUSE_NOT_FOUND) {
          return new SaleWarehouseNotFoundError(message ?? 'Warehouse not found.');
        }
        if (errorCode === SALE_ERROR_CODES.SALE_LINE_NOT_FOUND) {
          return new SaleLineNotFoundError(message ?? 'Sale line not found.');
        }
        return new SaleNotFoundError(message ?? 'Sale not found.');
      default:
        return new SaleApiError(message ?? 'Unexpected sales API error.');
    }
  }

  private mapBusinessOrValidationError(
    errorCode: number | undefined,
    err: HttpErrorResponse,
    message: string | undefined
  ): Error {
    const businessErrorKey = this.buildBusinessErrorKey(err.status, errorCode);

    switch (businessErrorKey) {
      case SALE_ERROR_CODES.CLIENT_NOT_ACTIVE:
        return new SaleClientNotActiveError(
          message ?? 'Client is not active and cannot receive sales.'
        );
      case SALE_ERROR_CODES.PRODUCT_NOT_ACTIVE:
        return new SaleProductNotActiveError(
          message ?? 'One or more products are inactive.'
        );
      case SALE_ERROR_CODES.INSUFFICIENT_STOCK:
        return new SaleInsufficientStockError(
          message ?? 'Insufficient stock for one or more products.'
        );
      case SALE_ERROR_CODES.EMPTY_LINES:
        return new SaleEmptyLinesError(message ?? 'At least one sale line is required.');
      case SALE_ERROR_CODES.INVALID_STATUS_TRANSITION:
        return new SaleInvalidStatusTransitionError(
          message ?? 'Invalid sale status transition.'
        );
      case SALE_ERROR_CODES.TERMINAL_STATE:
        return new SaleTerminalStateError(message ?? 'Sale is in a terminal state.');
      case SALE_ERROR_CODES.NOT_PENDING:
        return new SaleNotPendingError(
          message ?? 'Sale must be in Pending status to be edited.'
        );
      case SALE_ERROR_CODES.DELIVERY_ADDRESS_REQUIRED:
        return new SaleDeliveryAddressRequiredError(
          message ?? 'Delivery address is required.'
        );
      case '400:8113':
        return new SaleNotDeletableError(
          message ?? 'Only pending sales can be deleted.'
        );
      case '422:8113':
        return new SaleInvalidDiscountError(
          message ?? 'Discount cannot make the line subtotal negative.'
        );
      case SALE_ERROR_CODES.MINIMUM_ONE_LINE:
        return new SaleMinimumOneLineError(
          message ?? 'A sale must have at least one line.'
        );
      default:
        break;
    }

    return new SaleValidationError(err.error, message ?? 'Sale validation failed.');
  }

  private buildBusinessErrorKey(
    status: number,
    errorCode: number | undefined
  ): number | string | undefined {
    if (
      errorCode === SALE_ERROR_CODES.AMBIGUOUS_NOT_DELETABLE_OR_INVALID_DISCOUNT
    ) {
      return `${status}:${errorCode}`;
    }

    return errorCode;
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
