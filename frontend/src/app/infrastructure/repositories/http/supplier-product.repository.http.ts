import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import {
  SupplierProductValidationError,
  SupplierProductUnauthorizedError,
  SupplierProductForbiddenError,
  SupplierProductNotFoundError,
  SupplierProductDuplicateError,
  SupplierProductApiError,
} from '@domain/models/supplier-product-errors';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';
import {
  SupplierProductDto,
  SupplierProductsPageDto,
  ImportResultDto,
} from '@infrastructure/dtos/supplier-product.dto';
import { SupplierProductMapper } from '@infrastructure/mappers/supplier-product.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/suppliers`;

@Injectable()
export class HttpSupplierProductRepository implements SupplierProductRepository {
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

    if (price > 999999.99) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must be less than 999999.99');
    }

    // Validar que tenga máximo 2 decimales
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new SupplierProductValidationError({ supplierPrice: price }, 'Supplier price must have maximum 2 decimal places');
    }
  }

  async getSupplierProducts(supplierId: number): Promise<SupplierProduct[]> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get<SupplierProductsPageDto>(`${BASE_URL}/${supplierId}/products`),
      );

      const result = SupplierProductMapper.fromPageDto(response, supplierId);
      return result.data;
    });
  }

  async addProductToSupplier(supplierId: number, request: AddSupplierProductRequest): Promise<SupplierProduct> {
    return this.withErrorMapping(async () => {
      this.validatePrice(request.supplierPrice);

      const dto = SupplierProductMapper.toAddDto(request);
      const response = await firstValueFrom(
        this.http.post<SupplierProductDto>(`${BASE_URL}/${supplierId}/products`, dto),
      );

      const result = SupplierProductMapper.fromDto(response);
      return {
        ...result,
        supplierId,
      };
    });
  }

  async updateSupplierProductPrice(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Promise<SupplierProduct> {
    return this.withErrorMapping(async () => {
      this.validatePrice(request.supplierPrice);

      const dto = SupplierProductMapper.toUpdateDto(request);
      const response = await firstValueFrom(
        this.http.put<SupplierProductDto>(`${BASE_URL}/${supplierId}/products/${productId}`, dto),
      );

      const result = SupplierProductMapper.fromDto(response);
      return {
        ...result,
        supplierId,
      };
    });
  }

  async removeProductFromSupplier(supplierId: number, productId: number): Promise<void> {
    return this.withErrorMapping(async () => {
      await firstValueFrom(
        this.http.delete<void>(`${BASE_URL}/${supplierId}/products/${productId}`),
      );
    });
  }

  async importSupplierProducts(supplierId: number, request: ImportSupplierProductsRequest): Promise<ImportResult> {
    return this.withErrorMapping(async () => {
      // Validar todos los precios antes de enviar
      for (const [index, product] of request.products.entries()) {
        if (!product.productCode || product.productCode.trim() === '') {
          throw new SupplierProductValidationError(
            { row: index + 1, productCode: product.productCode },
            `Row ${index + 1}: Product code is required`
          );
        }

        this.validatePrice(product.supplierPrice);
      }

      const importData = SupplierProductMapper.toImportResultDto(request);
      const formData = new FormData();
      formData.append('products', JSON.stringify(importData.products));

      const response = await firstValueFrom(
        this.http.post<ImportResultDto>(`${BASE_URL}/${supplierId}/products/import`, formData),
      );

      return SupplierProductMapper.importResultFromDto(response);
    });
  }
}
