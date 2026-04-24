import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  catchError,
  concatMap,
  defaultIfEmpty,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import {
  PurchaseApiError,
  PurchaseBusinessRuleError,
  PurchaseForbiddenError,
  PurchaseInvalidStatusTransitionError,
  PurchaseNotFoundError,
  PurchaseUnauthorizedError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import {
  CancelPurchasePayload,
  ChangePurchaseStatusPayload,
  CreatePurchasePayload,
  PagedResult,
  PurchaseDetail,
  PurchaseLineInput,
  PurchaseQueryParams,
  PurchaseSummary,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import {
  CatalogProductDto,
  PurchaseDetailDto,
  PurchasesPageDto,
  SupplierProductsPageDto,
  SuppliersPageDto,
} from '@infrastructure/dtos/purchase.dto';
import { PurchaseMapper, PurchaseWarehouseDto } from '@infrastructure/mappers/purchase.mapper';
import { environment } from 'environments/environment';

const PURCHASES_URL = `${environment.apiUrl}/api/v1/purchases`;
const WAREHOUSES_URL = `${environment.apiUrl}/api/v1/warehouse/warehouses`;
const SUPPLIERS_URL = `${environment.apiUrl}/api/v1/suppliers`;
const CATALOG_PRODUCTS_URL = `${environment.apiUrl}/api/v1/catalog/products`;

const PURCHASE_ERROR_CODES = {
  NOT_FOUND: 7101,
  NOT_PENDING: 7108,
  NOT_CANCELLABLE: 7111,
  NOT_DELETABLE: 7112,
  INVALID_TRANSITION: 7113,
} as const;

@Injectable()
export class HttpPurchaseRepository implements PurchaseRepository {
  private readonly http = inject(HttpClient);

  getPurchases(params: PurchaseQueryParams): Observable<PagedResult<PurchaseSummary>> {
    const query = PurchaseMapper.toQueryParams(params);

    return this.withErrorMapping(() =>
      this.http.get<PurchasesPageDto>(PURCHASES_URL, { params: query }).pipe(
        switchMap((pageDto) => {
          if (pageDto.items.length === 0) {
            return of(PurchaseMapper.toPagedResult(pageDto, []));
          }

          const supplierRefs$ = forkJoin(
            pageDto.items.map((item) =>
              this.http.get<PurchaseDetailDto>(`${PURCHASES_URL}/${item.purchase_id}`).pipe(
                map((detail) => ({ purchaseId: item.purchase_id, supplierId: detail.supplier_id })),
              ),
            ),
          );

          const warehouses$ = this.http.get<PurchaseWarehouseDto[]>(WAREHOUSES_URL).pipe(
            map((warehouses) =>
              new Map(
                warehouses.map((warehouse) => [
                  warehouse.warehouse_id,
                  PurchaseMapper.formatWarehouseAddress(warehouse.address),
                ]),
              ),
            ),
          );

          return forkJoin({ supplierRefs: supplierRefs$, warehouses: warehouses$ }).pipe(
            map(({ supplierRefs, warehouses }) => {
              const supplierIds = new Map(
                supplierRefs.map((reference) => [reference.purchaseId, reference.supplierId]),
              );

              const data = pageDto.items.map((item) =>
                PurchaseMapper.fromSummaryDto(
                  item,
                  supplierIds.get(item.purchase_id) ?? 0,
                  warehouses.get(item.warehouse_id) ?? '',
                ),
              );

              return PurchaseMapper.toPagedResult(pageDto, data);
            }),
          );
        }),
      ),
    );
  }

  getPurchaseById(purchaseId: number): Observable<PurchaseDetail> {
    return this.withErrorMapping(() =>
      this.http.get<PurchaseDetailDto>(`${PURCHASES_URL}/${purchaseId}`).pipe(
        switchMap((dto) =>
          this.resolveWarehouseAddress(dto.warehouse_id).pipe(
            map((address) => PurchaseMapper.fromDetailDto(dto, address)),
          ),
        ),
      ),
    );
  }

  createPurchase(payload: CreatePurchasePayload): Observable<PurchaseDetail> {
    return this.withErrorMapping(() =>
      this.http
        .post<PurchaseDetailDto>(PURCHASES_URL, PurchaseMapper.toCreateDto(payload))
        .pipe(switchMap((dto) => this.getPurchaseById(dto.purchase_id))),
    );
  }

  updatePurchase(
    purchaseId: number,
    payload: UpdatePurchasePayload,
  ): Observable<PurchaseDetail> {
    return this.withErrorMapping(() =>
      this.getPurchaseById(purchaseId).pipe(
        switchMap((currentPurchase) => {
          const supplierId = payload.supplierId ?? currentPurchase.supplierId;
          const warehouseId =
            payload.deliveryWarehouseId ?? currentPurchase.deliveryWarehouseId;

          return this.http
            .put<PurchaseDetailDto>(
              `${PURCHASES_URL}/${purchaseId}`,
              PurchaseMapper.toUpdateDto(supplierId, warehouseId),
            )
            .pipe(
              switchMap((updatedPurchase) => {
                if (payload.lines === undefined) {
                  return this.getPurchaseById(purchaseId);
                }

                return this.replacePurchaseLines(
                  purchaseId,
                  updatedPurchase.lines,
                  payload.lines,
                ).pipe(switchMap(() => this.getPurchaseById(purchaseId)));
              }),
            );
        }),
      ),
    );
  }

  cancelPurchase(
    purchaseId: number,
    _payload: CancelPurchasePayload,
  ): Observable<PurchaseDetail> {
    void _payload;

    return this.withErrorMapping(() =>
      this.http
        .patch<PurchaseDetailDto>(`${PURCHASES_URL}/${purchaseId}/cancel`, {})
        .pipe(switchMap(() => this.getPurchaseById(purchaseId))),
    );
  }

  deletePurchase(purchaseId: number): Observable<void> {
    return this.withErrorMapping(() => this.http.delete<void>(`${PURCHASES_URL}/${purchaseId}`));
  }

  changePurchaseStatus(
    purchaseId: number,
    payload: ChangePurchaseStatusPayload,
  ): Observable<PurchaseDetail> {
    return this.withErrorMapping(() =>
      this.http
        .patch<PurchaseDetailDto>(
          `${PURCHASES_URL}/${purchaseId}/status`,
          PurchaseMapper.toAdvanceStatusDto(payload.toStatus),
        )
        .pipe(switchMap(() => this.getPurchaseById(purchaseId))),
    );
  }

  getActiveSuppliers(): Observable<PurchaseSupplierOption[]> {
    return this.withErrorMapping(() =>
      this.http
        .get<SuppliersPageDto>(SUPPLIERS_URL, {
          params: { page: 1, page_size: 100, active: true },
        })
        .pipe(
          map((pageDto) =>
            pageDto.items
              .filter((supplier) => supplier.is_active)
              .map((supplier) => PurchaseMapper.fromSupplierDto(supplier)),
          ),
        ),
    );
  }

  getDeliveryWarehouses(): Observable<PurchaseWarehouseOption[]> {
    return this.withErrorMapping(() =>
      this.http
        .get<PurchaseWarehouseDto[]>(WAREHOUSES_URL)
        .pipe(map((warehouses) => warehouses.map((warehouse) => PurchaseMapper.fromWarehouseDto(warehouse)))),
    );
  }

  getSupplierProducts(supplierId: number): Observable<PurchaseSupplierProductOption[]> {
    return this.withErrorMapping(() =>
      this.http
        .get<SupplierProductsPageDto>(`${SUPPLIERS_URL}/${supplierId}/products`, {
          params: { page: 1, page_size: 100 },
        })
        .pipe(
          switchMap((pageDto) => {
            if (pageDto.items.length === 0) {
              return of([]);
            }

            const vatRates$ = forkJoin(
              pageDto.items.map((item) =>
                this.http
                  .get<CatalogProductDto>(`${CATALOG_PRODUCTS_URL}/${item.product_id}`)
                  .pipe(
                    map((catalogProduct) => ({
                      productId: item.product_id,
                      vatRate: PurchaseMapper.toDomainVatRate(catalogProduct.vat_rate),
                    })),
                  ),
              ),
            );

            return vatRates$.pipe(
              map((vatRates) => {
                const vatRateByProductId = new Map(
                  vatRates.map((vatRate) => [vatRate.productId, vatRate.vatRate]),
                );

                return pageDto.items.map((item) =>
                  PurchaseMapper.toSupplierProductOption(
                    supplierId,
                    item,
                    vatRateByProductId.get(item.product_id) ?? 21,
                  ),
                );
              }),
            );
          }),
        ),
    );
  }

  private replacePurchaseLines(
    purchaseId: number,
    existingLines: PurchaseDetailDto['lines'],
    nextLines: PurchaseLineInput[],
  ): Observable<void> {
    const removeLines$ = from(existingLines).pipe(
      concatMap((line) =>
        this.http.delete<PurchaseDetailDto>(
          `${PURCHASES_URL}/${purchaseId}/lines/${line.purchase_line_id}`,
        ),
      ),
      defaultIfEmpty(null),
      map(() => undefined),
    );

    const addLines$ = from(nextLines).pipe(
      concatMap((line) =>
        this.http.post<PurchaseDetailDto>(
          `${PURCHASES_URL}/${purchaseId}/lines`,
          PurchaseMapper.toAddLineDto(line),
        ),
      ),
      defaultIfEmpty(null),
      map(() => undefined),
    );

    return removeLines$.pipe(switchMap(() => addLines$));
  }

  private resolveWarehouseAddress(warehouseId: number): Observable<string> {
    return this.http.get<PurchaseWarehouseDto[]>(WAREHOUSES_URL).pipe(
      map((warehouses) => {
        const warehouse = warehouses.find((item) => item.warehouse_id === warehouseId);
        return PurchaseMapper.formatWarehouseAddress(warehouse?.address ?? null);
      }),
    );
  }

  private withErrorMapping<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(catchError((err) => throwError(() => this.mapHttpError(err))));
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new PurchaseApiError();
    }

    const message = this.extractErrorMessage(err);
    const errorCode = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
      case 422:
        if (errorCode === PURCHASE_ERROR_CODES.INVALID_TRANSITION) {
          return new PurchaseInvalidStatusTransitionError(
            'Pending',
            'Pending',
            message ?? 'This status transition is not allowed.',
          );
        }

        if (
          errorCode === PURCHASE_ERROR_CODES.NOT_PENDING ||
          errorCode === PURCHASE_ERROR_CODES.NOT_CANCELLABLE ||
          errorCode === PURCHASE_ERROR_CODES.NOT_DELETABLE
        ) {
          return new PurchaseBusinessRuleError(message ?? 'Purchase business rule violated.');
        }

        return new PurchaseValidationError(err.error, message ?? 'Purchase validation failed.');
      case 401:
        return new PurchaseUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new PurchaseForbiddenError(message ?? 'Insufficient permissions to manage purchases.');
      case 404:
        if (errorCode === PURCHASE_ERROR_CODES.NOT_FOUND) {
          return new PurchaseNotFoundError(message ?? 'Purchase not found.');
        }

        return new PurchaseNotFoundError(message ?? 'Purchase resource not found.');
      default:
        return new PurchaseApiError(message ?? 'Unexpected purchases API error.');
    }
  }

  private extractErrorCode(err: HttpErrorResponse): number | undefined {
    if (!err.error || typeof err.error !== 'object') {
      return undefined;
    }

    const payload = err.error as Record<string, unknown>;
    const rawCode = payload['error_code'];

    return typeof rawCode === 'number' ? rawCode : undefined;
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
