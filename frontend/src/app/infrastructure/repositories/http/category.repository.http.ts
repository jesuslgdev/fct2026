import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

  private async withErrorMapping<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err);
    }
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new CategoryApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new CategoryValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new CategoryUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new CategoryForbiddenError(message ?? 'Admin permissions required.');
      case 404:
        return new CategoryNotFoundError(message ?? 'Category not found.');
      case 409:
        if (message?.includes('already exists')) {
          return new CategoryAlreadyExistsError(message);
        }
        if (message?.includes('products')) {
          return new CategoryHasProductsError(message);
        }
        return new CategoryApiError(message ?? 'Category conflict.');
      default:
        return new CategoryApiError(message ?? 'Unexpected categories API error.');
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

  async getCategories(): Promise<CategoryListResult> {
    return this.withErrorMapping(async () => {
      const dtos = await firstValueFrom(
        this.http.get<CategoryDto[]>(BASE_URL)
      );
      return CategoryMapper.fromListDto(dtos);
    });
  }

  async getCategoryById(categoryId: number): Promise<Category> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.get<CategoryDto>(`${BASE_URL}/${categoryId}`)
      );
      return CategoryMapper.fromDto(dto);
    });
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    return this.withErrorMapping(async () => {
      try {
        const dtos = await firstValueFrom(
          this.http.get<CategoryDto[]>(`${BASE_URL}?search=${encodeURIComponent(name)}`)
        );
        const found = dtos.find(dto => dto.name.toLowerCase() === name.toLowerCase());
        return found ? CategoryMapper.fromDto(found) : null;
      } catch (error) {
        if (error instanceof CategoryNotFoundError) {
          return null;
        }
        throw error;
      }
    });
  }

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    return this.withErrorMapping(async () => {
      const dto: CreateCategoryDto = { name: payload.name, description: payload.description };
      const response = await firstValueFrom(
        this.http.post<CategoryDto>(BASE_URL, dto)
      );
      return CategoryMapper.fromDto(response);
    });
  }

  async updateCategory(
    categoryId: number,
    payload: UpdateCategoryPayload
  ): Promise<Category> {
    return this.withErrorMapping(async () => {
      const dto: UpdateCategoryDto = {};
      if (payload.name !== undefined && payload.name !== null) dto.name = payload.name;
      if (payload.description !== undefined && payload.description !== null) dto.description = payload.description;

      const response = await firstValueFrom(
        this.http.put<CategoryDto>(`${BASE_URL}/${categoryId}`, dto)
      );
      return CategoryMapper.fromDto(response);
    });
  }

  async deleteCategory(categoryId: number): Promise<void> {
    return this.withErrorMapping(async () => {
      await firstValueFrom(
        this.http.delete<void>(`${BASE_URL}/${categoryId}`)
      );
    });
  }
}
