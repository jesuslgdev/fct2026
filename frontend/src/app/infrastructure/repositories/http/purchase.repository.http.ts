import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  EMPTY,
  Observable,
  catchError,
  concatMap,
  defaultIfEmpty,
  expand,
  finalize,
  forkJoin,
  from,
  map,
  of,
  reduce,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { PURCHASE_STATUSES } from '@domain/enums/purchase-status.enum';
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
  AdvancePurchaseStatusRequestDto,
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
const PAGE_SIZE = 100;

const PURCHASE_ERROR_CODES = {
  NOT_FOUND: 7101,
  SUPPLIER_NOT_ACTIVE: 7102,
  PRODUCT_NOT_FOUND: 7103,
  PRODUCT_NOT_ACTIVE: 7104,
  PRODUCT_NOT_LINKED: 7105,
  NO_LINES: 7106,
  INVALID_DISCOUNT: 7107,
  NOT_PENDING: 7108,
  LINE_NOT_FOUND: 7109,
  SUPPLIER_NOT_FOUND: 7110,
  NOT_CANCELLABLE: 7111,
  NOT_DELETABLE: 7112,
  INVALID_TRANSITION: 7113,
} as const;

const PURCHASE_BUSINESS_RULE_ERROR_CODES = new Set<number>([
  PURCHASE_ERROR_CODES.SUPPLIER_NOT_ACTIVE,
  PURCHASE_ERROR_CODES.PRODUCT_NOT_ACTIVE,
  PURCHASE_ERROR_CODES.PRODUCT_NOT_LINKED,
  PURCHASE_ERROR_CODES.NO_LINES,
  PURCHASE_ERROR_CODES.INVALID_DISCOUNT,
  PURCHASE_ERROR_CODES.NOT_PENDING,
  PURCHASE_ERROR_CODES.NOT_CANCELLABLE,
  PURCHASE_ERROR_CODES.NOT_DELETABLE,
]);

const PURCHASE_NOT_FOUND_ERROR_CODES = new Set<number>([
  PURCHASE_ERROR_CODES.NOT_FOUND,
  PURCHASE_ERROR_CODES.PRODUCT_NOT_FOUND,
  PURCHASE_ERROR_CODES.LINE_NOT_FOUND,
  PURCHASE_ERROR_CODES.SUPPLIER_NOT_FOUND,
]);

const DEFAULT_TRANSITION_STATUS = PURCHASE_STATUSES[0];

@Injectable()
export class HttpPurchaseRepository implements PurchaseRepository {
  private readonly http = inject(HttpClient);
  private warehousesById: Map<number, string> | null = null;
  private warehousesByIdRequest$: Observable<Map<number, string>> | null = null;

  getPurchases(params: PurchaseQueryParams): Observable<PagedResult<PurchaseSummary>> {
    const query = PurchaseMapper.toQueryParams(params);

    return this.withErrorMapping(() =>
      this.http.get<PurchasesPageDto>(PURCHASES_URL, { params: query }).pipe(
        switchMap((pageDto) => {
          if (pageDto.items.length === 0) {
            return of(PurchaseMapper.toPagedResult(pageDto, []));
          }

          return this.getWarehouseAddressMap().pipe(
            map((warehouses) => {
              const data = pageDto.items.map((item) =>
                PurchaseMapper.fromSummaryDto(
                  item,
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
      this.patchPurchaseStatus(purchaseId, payload)
        .pipe(switchMap(() => this.getPurchaseById(purchaseId))),
    );
  }

  getActiveSuppliers(): Observable<PurchaseSupplierOption[]> {
    return this.withErrorMapping(() =>
      this.fetchAllActiveSuppliers()
        .pipe(
          map((suppliers) =>
            suppliers
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
      this.fetchAllSupplierProducts(supplierId)
        .pipe(
          switchMap((supplierProducts) => {
            if (supplierProducts.length === 0) {
              return of([]);
            }

            const vatRates$ = forkJoin(
              supplierProducts.map((item) =>
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

                return supplierProducts.map((item) =>
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

  private fetchAllActiveSuppliers(): Observable<SuppliersPageDto['items']> {
    return this.http
      .get<SuppliersPageDto>(SUPPLIERS_URL, {
        params: { page: 1, page_size: PAGE_SIZE, active: true },
      })
      .pipe(
        expand((pageDto) => {
          if (!this.hasNextPage(pageDto.page, pageDto.page_size, pageDto.total)) {
            return EMPTY;
          }

          return this.http.get<SuppliersPageDto>(SUPPLIERS_URL, {
            params: {
              page: pageDto.page + 1,
              page_size: pageDto.page_size,
              active: true,
            },
          });
        }),
        map((pageDto) => pageDto.items),
        reduce((allItems, pageItems) => [...allItems, ...pageItems], [] as SuppliersPageDto['items']),
      );
  }

  private fetchAllSupplierProducts(
    supplierId: number,
  ): Observable<SupplierProductsPageDto['items']> {
    return this.http
      .get<SupplierProductsPageDto>(`${SUPPLIERS_URL}/${supplierId}/products`, {
        params: { page: 1, page_size: PAGE_SIZE },
      })
      .pipe(
        expand((pageDto) => {
          if (!this.hasNextPage(pageDto.page, pageDto.page_size, pageDto.total)) {
            return EMPTY;
          }

          return this.http.get<SupplierProductsPageDto>(
            `${SUPPLIERS_URL}/${supplierId}/products`,
            {
              params: {
                page: pageDto.page + 1,
                page_size: pageDto.page_size,
              },
            },
          );
        }),
        map((pageDto) => pageDto.items),
        reduce(
          (allItems, pageItems) => [...allItems, ...pageItems],
          [] as SupplierProductsPageDto['items'],
        ),
      );
  }

  private replacePurchaseLines(
    purchaseId: number,
    existingLines: PurchaseDetailDto['lines'],
    nextLines: PurchaseLineInput[],
  ): Observable<void> {
    if (nextLines.length === 0) {
      return throwError(() => new PurchaseValidationError('A purchase must contain at least one line.'));
    }

    const syncPlan = this.buildPurchaseLineSyncPlan(existingLines, nextLines);

    const updateLines$ = from(syncPlan.linesToUpdate).pipe(
      concatMap((entry) =>
        this.http.put<PurchaseDetailDto>(
          `${PURCHASES_URL}/${purchaseId}/lines/${entry.lineId}`,
          PurchaseMapper.toUpdateLineDto(entry.line),
        ),
      ),
      defaultIfEmpty(null),
      map(() => undefined),
    );

    const addLines$ = from(syncPlan.linesToAdd).pipe(
      concatMap((line) =>
        this.http.post<PurchaseDetailDto>(
          `${PURCHASES_URL}/${purchaseId}/lines`,
          PurchaseMapper.toAddLineDto(line),
        ),
      ),
      defaultIfEmpty(null),
      map(() => undefined),
    );

    const removeLines$ = from(syncPlan.lineIdsToDelete).pipe(
      concatMap((lineId) => this.http.delete<PurchaseDetailDto>(`${PURCHASES_URL}/${purchaseId}/lines/${lineId}`)),
      defaultIfEmpty(null),
      map(() => undefined),
    );

    return updateLines$.pipe(
      switchMap(() => addLines$),
      switchMap(() => removeLines$),
    );
  }

  private buildPurchaseLineSyncPlan(
    existingLines: PurchaseDetailDto['lines'],
    nextLines: PurchaseLineInput[],
  ): {
    linesToUpdate: { lineId: number; line: PurchaseLineInput }[];
    linesToAdd: PurchaseLineInput[];
    lineIdsToDelete: number[];
  } {
    const existingByProductId = new Map<number, PurchaseDetailDto['lines']>();

    for (const existingLine of existingLines) {
      const queue = existingByProductId.get(existingLine.product_id) ?? [];
      queue.push(existingLine);
      existingByProductId.set(existingLine.product_id, queue);
    }

    const linesToUpdate: { lineId: number; line: PurchaseLineInput }[] = [];
    const linesToAdd: PurchaseLineInput[] = [];

    for (const nextLine of nextLines) {
      const queue = existingByProductId.get(nextLine.productId);
      const existingLine = queue?.shift();

      if (existingLine) {
        linesToUpdate.push({
          lineId: existingLine.purchase_line_id,
          line: nextLine,
        });
        continue;
      }

      linesToAdd.push(nextLine);
    }

    const lineIdsToDelete = [...existingByProductId.values()]
      .flat()
      .map((line) => line.purchase_line_id);

    return {
      linesToUpdate,
      linesToAdd,
      lineIdsToDelete,
    };
  }

  private patchPurchaseStatus(
    purchaseId: number,
    payload: ChangePurchaseStatusPayload,
  ): Observable<PurchaseDetailDto> {
    const statusUrl = `${PURCHASES_URL}/${purchaseId}/status`;
    const requestPayload = PurchaseMapper.toAdvanceStatusDto(payload.toStatus);

    if (payload.toStatus !== 'InProcess') {
      return this.http.patch<PurchaseDetailDto>(statusUrl, requestPayload);
    }

    const legacyPayload: AdvancePurchaseStatusRequestDto = { status: 'In Process' };

    return this.http.patch<PurchaseDetailDto>(statusUrl, requestPayload).pipe(
      catchError((err) => {
        if (!this.shouldRetryWithLegacyInProcessStatus(err)) {
          return throwError(() => err);
        }

        return this.http.patch<PurchaseDetailDto>(statusUrl, legacyPayload);
      }),
    );
  }

  private resolveWarehouseAddress(warehouseId: number): Observable<string> {
    return this.getWarehouseAddressMap().pipe(
      map((warehouses) => warehouses.get(warehouseId) ?? ''),
    );
  }

  private getWarehouseAddressMap(): Observable<Map<number, string>> {
    if (this.warehousesById !== null) {
      return of(this.warehousesById);
    }

    if (this.warehousesByIdRequest$ !== null) {
      return this.warehousesByIdRequest$;
    }

    this.warehousesByIdRequest$ = this.http.get<PurchaseWarehouseDto[]>(WAREHOUSES_URL).pipe(
      map((warehouses) =>
        new Map(
          warehouses.map((warehouse) => [
            warehouse.warehouse_id,
            PurchaseMapper.formatWarehouseAddress(warehouse.address),
          ]),
        ),
      ),
      tap((warehouseMap) => {
        this.warehousesById = warehouseMap;
      }),
      finalize(() => {
        this.warehousesByIdRequest$ = null;
      }),
      shareReplay(1),
    );

    return this.warehousesByIdRequest$;
  }

  private withErrorMapping<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(catchError((err) => throwError(() => this.mapHttpError(err))));
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new PurchaseApiError();
    }

    if (err.status === 0) {
      return new PurchaseApiError('Unable to reach purchases service. Please verify your connection and try again.');
    }

    const message = this.extractErrorMessage(err);
    const errorCode = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
        return this.mapKnownDomainError(errorCode, err.error, message);
      case 409:
        if (errorCode === undefined) {
          return new PurchaseBusinessRuleError(message ?? 'Purchase operation conflict.');
        }

        return this.mapKnownDomainError(errorCode, err.error, message);
      case 422:
        return this.mapKnownDomainError(errorCode, err.error, message);
      case 401:
        return new PurchaseUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new PurchaseForbiddenError(message ?? 'Insufficient permissions to manage purchases.');
      case 404:
        if (errorCode !== undefined && PURCHASE_NOT_FOUND_ERROR_CODES.has(errorCode)) {
          return new PurchaseNotFoundError(message ?? 'Purchase resource not found.');
        }

        return new PurchaseNotFoundError(message ?? 'Purchase resource not found.');
      default:
        return new PurchaseApiError(message ?? 'Unexpected purchases API error.');
    }
  }

  private mapKnownDomainError(
    errorCode: number | undefined,
    errorPayload: unknown,
    message: string | undefined,
  ): Error {
    if (errorCode === PURCHASE_ERROR_CODES.INVALID_TRANSITION) {
      return new PurchaseInvalidStatusTransitionError(
        DEFAULT_TRANSITION_STATUS,
        DEFAULT_TRANSITION_STATUS,
        message ?? 'This status transition is not allowed.',
      );
    }

    if (errorCode !== undefined && PURCHASE_BUSINESS_RULE_ERROR_CODES.has(errorCode)) {
      return new PurchaseBusinessRuleError(message ?? 'Purchase business rule violated.');
    }

    if (errorCode !== undefined && PURCHASE_NOT_FOUND_ERROR_CODES.has(errorCode)) {
      return new PurchaseNotFoundError(message ?? 'Purchase resource not found.');
    }

    return new PurchaseValidationError(errorPayload, message ?? 'Purchase validation failed.');
  }

  private extractErrorCode(err: HttpErrorResponse): number | undefined {
    if (!err.error || typeof err.error !== 'object') {
      return undefined;
    }

    const payload = err.error as Record<string, unknown>;
    const rawCode = payload['error_code'];

    if (typeof rawCode === 'number') {
      return rawCode;
    }

    if (typeof rawCode === 'string') {
      const parsedCode = Number.parseInt(rawCode, 10);
      return Number.isFinite(parsedCode) ? parsedCode : undefined;
    }

    return undefined;
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

      if (Array.isArray(rawDetail)) {
        const validationMessage = this.formatValidationDetails(rawDetail);
        if (validationMessage) {
          return validationMessage;
        }
      }
    }

    return undefined;
  }

  private formatValidationDetails(details: unknown[]): string | undefined {
    const messages = details
      .map((detail) => this.formatValidationEntry(detail))
      .filter((message): message is string => Boolean(message));

    if (messages.length === 0) {
      return undefined;
    }

    return messages.join(' | ');
  }

  private formatValidationEntry(detail: unknown): string | undefined {
    if (!detail || typeof detail !== 'object') {
      return undefined;
    }

    const payload = detail as Record<string, unknown>;
    const rawLocation = payload['loc'];
    const rawMessage = payload['msg'];

    if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return undefined;
    }

    if (!Array.isArray(rawLocation) || rawLocation.length === 0) {
      return rawMessage.trim();
    }

    const location = rawLocation
      .map((part) => (typeof part === 'string' || typeof part === 'number' ? String(part) : ''))
      .filter((part) => part.length > 0)
      .join('.');

    if (!location) {
      return rawMessage.trim();
    }

    return `${location}: ${rawMessage.trim()}`;
  }

  private hasNextPage(page: number, pageSize: number, total: number): boolean {
    return page * pageSize < total;
  }

  private shouldRetryWithLegacyInProcessStatus(err: unknown): boolean {
    if (!(err instanceof HttpErrorResponse) || err.status !== 422) {
      return false;
    }

    const message = this.extractErrorMessage(err)?.toLowerCase() ?? '';

    return message.includes('in process') && message.includes('status');
  }
}
