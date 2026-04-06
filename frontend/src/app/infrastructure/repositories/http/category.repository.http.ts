import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import {
  CategoryApiError,
  CategoryForbiddenError,
  CategoryNotFoundError,
  CategoryUnauthorizedError,
  CategoryValidationError,
  CategoryAlreadyExistsError,
  CategoryHasProductsError,
} from '@domain/models/category-errors';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResult,
} from '@domain/models/category.model';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@infrastructure/dtos/category.dto';
import { CategoryMapper } from '@infrastructure/mappers/category.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/catalog/categories`;

@Injectable()
export class HttpCategoryRepository implements CategoryRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new CategoryApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new CategoryValidationError(err.error, message ?? 'La validación falló.');
      case 401:
        return new CategoryUnauthorizedError(message ?? 'Autenticación requerida.');
      case 403:
        return new CategoryForbiddenError(message ?? 'Permisos de administrador requeridos.');
      case 404:
        return new CategoryNotFoundError(message ?? 'Categoría no encontrada.');
      case 409:
        if (message?.includes('already exists')) {
          return new CategoryAlreadyExistsError('El nombre de la categoría ya existe.');
        }
        if (message?.includes('products')) {
          return new CategoryHasProductsError('La categoría tiene productos asociados.');
        }
        return new CategoryApiError(message ?? 'Conflicto en la categoría.');
      default:
        return new CategoryApiError(message ?? 'Error inesperado en la API.');
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

  getCategories(): Observable<CategoryListResult> {
    return this.http.get<CategoryDto[]>(BASE_URL).pipe(
      map((dtos) => CategoryMapper.fromListDto(dtos)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<CategoryDto>(`${BASE_URL}/${categoryId}`).pipe(
      map((dto) => CategoryMapper.fromDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getCategoryByName(name: string): Observable<Category | null> {
    return this.http.get<CategoryDto[]>(BASE_URL).pipe(
      map((dtos) => {
        const found = dtos.find(
          (dto) => dto.name.toLowerCase() === name.toLowerCase()
        );
        return found ? CategoryMapper.fromDto(found) : null;
      }),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    const dto: CreateCategoryDto = {
      name: payload.name,
      description: payload.description ?? ''
    };
    return this.http.post<CategoryDto>(BASE_URL, dto).pipe(
      map((response) => CategoryMapper.fromDto(response)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  updateCategory(
    categoryId: number,
    payload: UpdateCategoryPayload
  ): Observable<Category> {
    const dto: UpdateCategoryDto = {};
    if (payload.name !== undefined && payload.name !== null) dto.name = payload.name;
    if (payload.description !== undefined && payload.description !== null) {
      dto.description = payload.description;
    }

    return this.http.put<CategoryDto>(`${BASE_URL}/${categoryId}`, dto).pipe(
      map((response) => CategoryMapper.fromDto(response)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${categoryId}`).pipe(
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }
}
