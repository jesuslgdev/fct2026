import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EMPTY, catchError, expand, map, of, reduce, throwError } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import {
  ProductApiError,
  ProductForbiddenError,
  ProductNotFoundError,
  ProductUnauthorizedError,
  ProductValidationError,
} from '@domain/models/product-errors';
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  ProductStockByWarehouse,
} from '@domain/models/product.model';
import {
  ProductDto,
  ProductsPageDto,
  ProductStockOverviewDto,
  ProductSuppliersPaginatedDto,
  SetProductActiveDto,
} from '@infrastructure/dtos/product.dto';
import { ProductMapper } from '@infrastructure/mappers/product.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/catalog/products`;
const SUPPLIERS_BY_PRODUCT_URL = `${environment.apiUrl}/api/v1/suppliers/products`;
const STOCK_BY_PRODUCT_URL = `${environment.apiUrl}/api/v1/warehouse/products`;

type ProductsPageResponse = Partial<ProductsPageDto> & {
  items?: ProductDto[];
  data?: ProductDto[];
  total?: number;
  page?: number;
  page_size?: number;
  pageSize?: number;
};

@Injectable()
export class HttpProductRepository implements ProductRepository {
  private readonly http = inject(HttpClient);

  private getProductsPage(page: number, pageSize: number, search?: string) {
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };

    if (search && search.trim().length > 0) {
      params['search'] = search;
    }

    return this.http.get<ProductsPageResponse>(BASE_URL, { params });
  }

  private normalizePageResponse(response: ProductsPageResponse, fallback: { page: number; pageSize: number; }): {
    items: ProductDto[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const items = Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.data)
        ? response.data
        : [];

    const page = typeof response.page === 'number' ? response.page : fallback.page;
    const pageSize = typeof response.page_size === 'number'
      ? response.page_size
      : typeof response.pageSize === 'number'
        ? response.pageSize
        : fallback.pageSize;
    const total = typeof response.total === 'number' ? response.total : items.length;

    return { items, total, page, pageSize };
  }

  private getAllProducts(pageSize = 100) {
    return this.getProductsPage(1, pageSize).pipe(
      expand((response) => {
        const normalized = this.normalizePageResponse(response, { page: 1, pageSize });
        const fetchedItems = normalized.page * normalized.pageSize;
        if (fetchedItems >= normalized.total) {
          return EMPTY;
        }

        return this.getProductsPage(normalized.page + 1, pageSize);
      }),
      map((response) => this.normalizePageResponse(response, { page: 1, pageSize }).items),
      reduce((allItems, currentItems) => allItems.concat(currentItems), [] as ProductDto[]),
      map((items) => items.map(ProductMapper.fromDto)),
    );
  }
  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new ProductApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new ProductValidationError(err.error, message ?? 'Product validation failed.');
      case 401:
        return new ProductUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new ProductForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new ProductNotFoundError(message ?? 'Product not found.');
      default:
        return new ProductApiError(message ?? 'Unexpected products API error.');
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

      if (Array.isArray(rawDetail) && rawDetail.length > 0) {
        return 'Validation failed.';
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

    return this.http.get<ProductsPageResponse>(BASE_URL, { params: query }).pipe(
      map((response) => {
        const normalized = this.normalizePageResponse(response, {
          page: params.page,
          pageSize: params.pageSize,
        });

        return {
          data: normalized.items.map(ProductMapper.fromDto),
          total: normalized.total,
          page: normalized.page,
          pageSize: normalized.pageSize,
        };
      }),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getProductById(productId: number) {
    return this.http.get<ProductDto>(`${BASE_URL}/${productId}`).pipe(
      map((dto) => ProductMapper.fromDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  createProduct(payload: CreateProductPayload) {
    return this.http.post<ProductDto>(BASE_URL, ProductMapper.toCreateDto(payload)).pipe(
      map((dto) => ProductMapper.fromDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  updateProduct(productId: number, payload: UpdateProductPayload) {
    return this.http.put<ProductDto>(`${BASE_URL}/${productId}`, ProductMapper.toUpdateDto(payload)).pipe(
      map((dto) => ProductMapper.fromDto(dto)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  toggleProductStatus(productId: number, isActive: boolean) {
    const body: SetProductActiveDto = { is_active: isActive };

    return this.http.patch<void>(`${BASE_URL}/${productId}/active`, body).pipe(
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  checkCodeExists(code: string) {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      return of(false);
    }

    const pageSize = 100;
    const normalizedCode = trimmedCode.toLowerCase();
    const toPageState = (response: ProductsPageResponse, fallbackPage: number) => {
      const normalized = this.normalizePageResponse(response, { page: fallbackPage, pageSize });
      const found = normalized.items.some((item) => {
        const itemCode = (item.product_code ?? item.code ?? '').toLowerCase();
        return itemCode === normalizedCode;
      });
      const hasMore = normalized.page * normalized.pageSize < normalized.total;

      return {
        found,
        hasMore,
        page: normalized.page,
      };
    };

    return this.getProductsPage(1, pageSize, trimmedCode).pipe(
      map((response) => toPageState(response, 1)),
      expand((state) => {
        if (state.found || !state.hasMore) {
          return EMPTY;
        }

        const nextPage = state.page + 1;
        return this.getProductsPage(nextPage, pageSize, trimmedCode).pipe(
          map((response) => toPageState(response, nextPage))
        );
      }),
      map((state) => state.found),
      reduce((exists, found) => exists || found, false),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getLowStockProducts() {
    return this.getAllProducts().pipe(
      map((products: Product[]) => products.filter((product) => product.stock < product.minStock)),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getProductSuppliers(productId: number) {
    return this.http.get<ProductSuppliersPaginatedDto>(`${SUPPLIERS_BY_PRODUCT_URL}/${productId}/suppliers`, {
      params: {
        page: 1,
        page_size: 100,
      },
    }).pipe(
      map((response) => {
        const items = Array.isArray(response.items) ? response.items : [];
        return items.map(ProductMapper.supplierFromDto);
      }),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }

  getProductStockByWarehouses(productId: number) {
    return this.http.get<ProductStockOverviewDto>(`${STOCK_BY_PRODUCT_URL}/${productId}/stock`).pipe(
      map((response) => {
        const fallbackMinStock = typeof response.stock_min === 'number' ? response.stock_min : 0;
        const warehouses = Array.isArray(response.warehouses) ? response.warehouses : [];

        return warehouses.map((warehouse): ProductStockByWarehouse => {
          return ProductMapper.stockByWarehouseFromDto(warehouse, fallbackMinStock);
        });
      }),
      catchError((err) => throwError(() => this.mapHttpError(err)))
    );
  }
}
