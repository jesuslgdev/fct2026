import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import {
  SupplierProductValidationError,
  SupplierProductUnauthorizedError,
  SupplierProductForbiddenError,
  SupplierProductNotFoundError,
  SupplierProductDuplicateError,
  SupplierProductSupplierInactiveError,
  SupplierProductItemInactiveError,
  SupplierProductApiError,
} from '@domain/models/supplier-product-errors';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
  ProductSupplier,
  PagedResult,
  SupplierProductQueryParams,
  ProductSupplierQueryParams,
} from '@domain/models/supplier-product.model';
import {
  SupplierProductDto,
  SupplierProductsPageDto,
  ImportResultDto,
  ProductSuppliersPageDto,
} from '@infrastructure/dtos/supplier-product.dto';
import { SupplierProductMapper } from '@infrastructure/mappers/supplier-product.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/suppliers`;

@Injectable()
export class HttpSupplierProductRepository implements SupplierProductRepository {
  private readonly http = inject(HttpClient);

  private withErrorMapping<T>(source$: Observable<T>): Observable<T> {
    return source$.pipe(
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new SupplierProductApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new SupplierProductValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new SupplierProductUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new SupplierProductForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new SupplierProductNotFoundError(message ?? 'Supplier product association not found.');
      case 409:
        if (message === 'Supplier is not active') {
          return new SupplierProductSupplierInactiveError(message);
        }
        if (message === 'Product is not active') {
          return new SupplierProductItemInactiveError(message);
        }
        return new SupplierProductDuplicateError(message ?? 'Product already associated with this supplier.');
      default:
        return new SupplierProductApiError(message ?? 'Unexpected supplier product API error.');
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

  private validatePrice(price: number): void {
    if (price <= 0) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must be greater than 0');
    }

    // Validar que tenga máximo 2 decimales
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must have maximum 2 decimal places');
    }
  }

  getSupplierProducts(supplierId: number, params?: SupplierProductQueryParams): Observable<PagedResult<SupplierProduct>> {
    const queryParams = params || { page: 1, pageSize: 10 };
    const httpParams = { page: queryParams.page.toString(), page_size: queryParams.pageSize.toString() };
    return this.withErrorMapping(
      this.http
        .get<SupplierProductsPageDto>(`${BASE_URL}/${supplierId}/products`, { params: httpParams })
        .pipe(map((response) => SupplierProductMapper.fromSupplierProductsPageDto(response))),
    );
  }

  addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Observable<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    const dto = SupplierProductMapper.toAddDto(request);

    return this.withErrorMapping(
      this.http
        .post<SupplierProductDto>(`${BASE_URL}/${supplierId}/products`, dto)
        .pipe(map((response) => SupplierProductMapper.fromDto(response))),
    );
  }

  updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Observable<SupplierProduct> {
    this.validatePrice(request.supplierPrice);

    const dto = SupplierProductMapper.toUpdateDto(request);

    return this.withErrorMapping(
      this.http
        .put<SupplierProductDto>(`${BASE_URL}/${supplierId}/products/${productId}`, dto)
        .pipe(map((response) => SupplierProductMapper.fromDto(response))),
    );
  }

  removeProductFromSupplier(supplierId: number, productId: number): Observable<void> {
    return this.withErrorMapping(
      this.http.delete<void>(`${BASE_URL}/${supplierId}/products/${productId}`),
    );
  }

  importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', request.file);

    return this.withErrorMapping(
      this.http
        .post<ImportResultDto>(`${BASE_URL}/${supplierId}/products/import`, formData)
        .pipe(map((response) => SupplierProductMapper.importResultFromDto(response))),
    );
  }

  downloadTemplate(supplierId: number): Observable<Blob> {
    return this.withErrorMapping(
      this.http.get<Blob>(`${BASE_URL}/${supplierId}/products/template`, {
        responseType: 'blob' as 'json',
      })
    );
  }

  getProductSuppliers(productId: number, params?: ProductSupplierQueryParams): Observable<PagedResult<ProductSupplier>> {
    const queryParams = params || { page: 1, pageSize: 10 };
    const httpParams = { page: queryParams.page.toString(), page_size: queryParams.pageSize.toString() };
    return this.withErrorMapping(
      this.http
        .get<ProductSuppliersPageDto>(`${BASE_URL}/products/${productId}/suppliers`, { params: httpParams })
        .pipe(map((response) => SupplierProductMapper.fromProductSuppliersPageDto(response))),
    );
  }
}
