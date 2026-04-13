import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import {
  ProductApiError,
  ProductNotFoundError,
  ProductValidationError,
} from '@domain/models/product-errors';
import {
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
} from '@domain/models/product.model';
import {
  ProductDto,
  ProductsPageDto,
} from '@infrastructure/dtos/product.dto';
import { ProductMapper } from '@infrastructure/mappers/product.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/admin/products`;

@Injectable()
export class HttpProductRepository implements ProductRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new ProductApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
        return new ProductValidationError(message);
      case 404:
        return new ProductNotFoundError(message);
      case 401:
      case 403:
        return new ProductApiError(message);
      default:
        return new ProductApiError(message);
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string | undefined {
    if (err.error?.detail) {
      return err.error.detail;
    }

    if (err.error?.message) {
      return err.error.message;
    }

    if (typeof err.error === 'string') {
      return err.error;
    }

    if (err.error?.non_field_errors?.length) {
      return err.error.non_field_errors.join(', ');
    }

    if (err.error) {
      const firstKey = Object.keys(err.error)[0];
      const rawDetail = err.error[firstKey];
      if (typeof rawDetail === 'string' && rawDetail.trim()) {
        return rawDetail;
      }
    }

    return undefined;
  }

  getProducts(params: ProductQueryParams) {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      page_size: params.pageSize,
    };

    if (params.search !== undefined) query['search'] = params.search;
    if (params.categoryId !== undefined) query['category_id'] = params.categoryId;
    if (params.active !== undefined) query['active'] = params.active;

    return this.http.get<ProductsPageDto>(BASE_URL, { params: query }).pipe(
      map(response => ({
        data: response.items.map(ProductMapper.fromDto),
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
      })),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  getProductById(productId: number) {
    return this.http.get<ProductDto>(`${BASE_URL}/${productId}`).pipe(
      map(dto => ProductMapper.fromDto(dto)),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  createProduct(payload: CreateProductPayload) {
    return this.http.post<ProductDto>(BASE_URL, ProductMapper.toCreateDto(payload)).pipe(
      map(dto => ProductMapper.fromDto(dto)),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  updateProduct(productId: number, payload: UpdateProductPayload) {
    return this.http.put<ProductDto>(`${BASE_URL}/${productId}`, ProductMapper.toUpdateDto(payload)).pipe(
      map(dto => ProductMapper.fromDto(dto)),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  toggleProductStatus(productId: number, isActive: boolean) {
    return this.http.patch<void>(`${BASE_URL}/${productId}/toggle-active`, { is_active: isActive }).pipe(
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  checkCodeExists(code: string) {
    return this.http.get<{ exists: boolean }>(`${BASE_URL}/check-code`, { params: { code } }).pipe(
      map(response => response.exists),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }

  getLowStockProducts() {
    return this.http.get<ProductDto[]>(`${BASE_URL}/low-stock`).pipe(
      map(dtos => dtos.map(ProductMapper.fromDto)),
      catchError(err => throwError(() => this.mapHttpError(err)))
    );
  }
}
