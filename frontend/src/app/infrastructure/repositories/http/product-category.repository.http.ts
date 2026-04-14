import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
import {
  ProductApiError,
  ProductForbiddenError,
  ProductNotFoundError,
  ProductUnauthorizedError,
  ProductValidationError,
} from '@domain/models/product-errors';
import { ProductCategoryDto } from '@infrastructure/dtos/product.dto';
import { ProductMapper } from '@infrastructure/mappers/product.mapper';
import { environment } from 'environments/environment';

const CATEGORIES_URL = `${environment.apiUrl}/api/v1/catalog/categories`;

@Injectable()
export class HttpProductCategoryRepository implements ProductCategoryRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new ProductApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new ProductValidationError(err.error, message ?? 'Category validation failed.');
      case 401:
        return new ProductUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new ProductForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new ProductNotFoundError(message ?? 'Category not found.');
      default:
        return new ProductApiError(message ?? 'Unexpected categories API error.');
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

  getCategories() {
    return this.http.get<ProductCategoryDto[]>(CATEGORIES_URL).pipe(
      map((dtos) => dtos.map(ProductMapper.categoryFromDto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getCategoryById(categoryId: number) {
    return this.http.get<ProductCategoryDto>(`${CATEGORIES_URL}/${categoryId}`).pipe(
      map((dto) => ProductMapper.categoryFromDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }
}
