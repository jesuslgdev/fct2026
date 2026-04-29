import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupplierRepository } from '@domain/repositories/supplier.repository';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierImportExecutionResult,
  SupplierImportTemplate,
} from '@domain/models/supplier.model';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import {
  SupplierDetailDto,
  SetSupplierActiveDto,
  SuppliersPageDto,
  SupplierProductsDto,
} from '@infrastructure/dtos/supplier.dto';
import { SupplierMapper } from '@infrastructure/mappers/supplier.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/suppliers`;

type SupplierRequestContext =
  | 'list'
  | 'detail'
  | 'create'
  | 'update'
  | 'activate'
  | 'deactivate'
  | 'products'
  | 'template'
  | 'import';

const SUPPLIER_ERROR_CODE_MESSAGES: Record<number, string> = {
  3101: 'El proveedor indicado no existe.',
  3102: 'Ya existe un proveedor con ese NIF/CIF.',
  3103: 'El formato del NIF/CIF no es válido.',
  3104: 'Ya existe un proveedor con ese correo electrónico.',
  3201: 'La asociación proveedor-producto no existe.',
  3202: 'El producto ya está asociado a este proveedor.',
  3203: 'No se puede completar la operación porque el proveedor está inactivo.',
  3204: 'No se puede completar la operación porque el producto está inactivo.',
  3205: 'El producto indicado no existe.',
  3206: 'El precio del proveedor debe ser mayor que 0.',
};

const DEFAULT_CONTEXT_MESSAGES: Record<SupplierRequestContext, string> = {
  list: 'No se pudo cargar el listado de proveedores.',
  detail: 'No se pudo cargar el proveedor solicitado.',
  create: 'No se pudo crear el proveedor.',
  update: 'No se pudo actualizar el proveedor.',
  activate: 'No se pudo activar el proveedor.',
  deactivate: 'No se pudo desactivar el proveedor.',
  products: 'No se pudieron cargar los productos del proveedor.',
  template: 'No se pudo descargar la plantilla de importación.',
  import: 'No se pudo completar la importación de proveedores.',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'nombre',
  tax_id: 'NIF/CIF',
  email: 'correo electrónico',
  phone: 'teléfono',
  city: 'ciudad',
  province: 'provincia',
  postal_code: 'código postal',
  address: 'dirección',
  'address.street': 'dirección',
  'address.city': 'ciudad',
  'address.province': 'provincia',
  'address.postal_code': 'código postal',
  supplier_id: 'proveedor',
  product_id: 'producto',
  is_active: 'estado activo',
  page: 'página',
  page_size: 'tamaño de página',
  search: 'búsqueda',
  active: 'activo',
  file: 'archivo',
};

interface ImportSuppliersApiResponse {
  total: number;
  created: number;
  errors: number;
  error_detail: { row: number; reason: string }[];
}

@Injectable()
export class HttpSupplierRepository implements SupplierRepository {
  private readonly http = inject(HttpClient);

  // Centralized error mapping
  private async withErrorMapping<T>(
    operation: () => Promise<T>,
    context: SupplierRequestContext,
  ): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err, context);
    }
  }

  private mapHttpError(err: unknown, context: SupplierRequestContext): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new Error(DEFAULT_CONTEXT_MESSAGES[context]);
    }

    if (err.status === 0) {
      return new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    }

    const appErrorCode = this.extractErrorCode(err);
    if (appErrorCode && SUPPLIER_ERROR_CODE_MESSAGES[appErrorCode]) {
      return new Error(SUPPLIER_ERROR_CODE_MESSAGES[appErrorCode]);
    }

    const validationMessage = this.extractValidationMessage(err);
    const detailMessage = this.extractErrorMessage(err);
    const translatedDetailMessage = detailMessage
      ? this.translateBackendMessage(detailMessage)
      : undefined;

    if (err.status === 400 || err.status === 422) {
      return new Error(
        validationMessage ??
          translatedDetailMessage ??
          'Los datos enviados no son válidos. Revisa los campos e inténtalo de nuevo.',
      );
    }

    switch (err.status) {
      case 401:
        return new Error(
          translatedDetailMessage ??
            'Tu sesión ha caducado o no es válida. Inicia sesión de nuevo.',
        );
      case 403:
        return new Error(
          translatedDetailMessage ?? 'No tienes permisos para realizar esta acción.',
        );
      case 404:
        return new Error(
          translatedDetailMessage ??
            this.getNotFoundMessage(context),
        );
      case 409:
        return new Error(
          translatedDetailMessage ?? this.getConflictMessage(context),
        );
      case 413:
        return new Error('El archivo es demasiado grande para procesarlo.');
      case 415:
        return new Error('El tipo de archivo no es compatible. Usa la plantilla oficial.');
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error('Se ha producido un error interno del servidor. Inténtalo de nuevo más tarde.');
      default:
        return new Error(
          translatedDetailMessage ?? DEFAULT_CONTEXT_MESSAGES[context],
        );
    }
  }

  private extractErrorCode(err: HttpErrorResponse): number | null {
    if (!err.error || typeof err.error !== 'object') {
      return null;
    }

    const payload = err.error as Record<string, unknown>;
    const rawErrorCode = payload['error_code'];
    return typeof rawErrorCode === 'number' ? rawErrorCode : null;
  }

  private extractValidationMessage(err: HttpErrorResponse): string | null {
    if (!err.error || typeof err.error !== 'object') {
      return null;
    }

    const payload = err.error as Record<string, unknown>;
    const detail = payload['detail'];
    if (!Array.isArray(detail)) {
      return null;
    }

    const formatted = detail
      .map((issue) => this.formatValidationIssue(issue))
      .filter((entry): entry is string => !!entry);

    if (formatted.length === 0) {
      return null;
    }

    return `Revisa los datos: ${formatted.join(' | ')}`;
  }

  private formatValidationIssue(issue: unknown): string | null {
    if (!issue || typeof issue !== 'object') {
      return null;
    }

    const payload = issue as Record<string, unknown>;
    const rawLoc = Array.isArray(payload['loc']) ? payload['loc'] : [];
    const loc = rawLoc.map((segment) => String(segment));
    const scope = loc[0];
    const pathSegments = ['body', 'query', 'path', 'header'].includes(scope)
      ? loc.slice(1)
      : loc;
    const fieldPath = pathSegments.join('.');
    const fieldLabel = this.toFieldLabel(fieldPath);
    const message = this.translateValidationMessage(
      typeof payload['msg'] === 'string' ? payload['msg'] : 'Valor inválido',
    );

    if (!fieldLabel) {
      return message;
    }

    return `${fieldLabel}: ${message}`;
  }

  private toFieldLabel(fieldPath: string): string {
    if (!fieldPath) {
      return '';
    }

    return FIELD_LABELS[fieldPath] ?? fieldPath.replaceAll('_', ' ');
  }

  private translateValidationMessage(message: string): string {
    const normalized = message.trim();
    if (!normalized) {
      return 'valor inválido';
    }

    const lower = normalized.toLowerCase();

    if (lower === 'field required') return 'es obligatorio';
    if (lower.includes('valid integer')) return 'debe ser un número entero válido';
    if (lower.includes('valid number')) return 'debe ser un número válido';
    if (lower.includes('valid string')) return 'debe ser un texto válido';
    if (lower.includes('valid boolean')) return 'debe ser un valor booleano válido';
    if (lower.includes('valid email')) return 'debe ser un correo electrónico válido';
    if (lower.includes('should match pattern')) return 'no cumple el formato requerido';

    const maxChars = normalized.match(/at most\s+(\d+)\s+characters/i);
    if (maxChars) {
      return `no puede tener más de ${maxChars[1]} caracteres`;
    }

    const minChars = normalized.match(/at least\s+(\d+)\s+characters/i);
    if (minChars) {
      return `debe tener al menos ${minChars[1]} caracteres`;
    }

    const greaterThan = normalized.match(/greater than\s+(-?\d+(?:\.\d+)?)/i);
    if (greaterThan) {
      return `debe ser mayor que ${greaterThan[1]}`;
    }

    const lessThanOrEqual = normalized.match(
      /less than or equal to\s+(-?\d+(?:\.\d+)?)/i,
    );
    if (lessThanOrEqual) {
      return `debe ser menor o igual que ${lessThanOrEqual[1]}`;
    }

    const greaterThanOrEqual = normalized.match(
      /greater than or equal to\s+(-?\d+(?:\.\d+)?)/i,
    );
    if (greaterThanOrEqual) {
      return `debe ser mayor o igual que ${greaterThanOrEqual[1]}`;
    }

    return normalized;
  }

  private translateBackendMessage(message: string): string {
    const normalized = message.trim();
    if (!normalized) {
      return normalized;
    }

    const literalMap: Record<string, string> = {
      'Supplier not found': 'El proveedor indicado no existe.',
      'Supplier with this tax ID already exists': 'Ya existe un proveedor con ese NIF/CIF.',
      'Supplier with this email already exists': 'Ya existe un proveedor con ese correo electrónico.',
      'Invalid tax ID format': 'El formato del NIF/CIF no es válido.',
      'Supplier-product association not found': 'La asociación proveedor-producto no existe.',
      'Supplier-product association already exists': 'El producto ya está asociado a este proveedor.',
      'Supplier is not active': 'No se puede completar la operación porque el proveedor está inactivo.',
      'Product is not active': 'No se puede completar la operación porque el producto está inactivo.',
      'Product not found': 'El producto indicado no existe.',
      'Supplier price must be greater than zero': 'El precio del proveedor debe ser mayor que 0.',
      'Invalid or expired token': 'Tu sesión ha caducado o no es válida. Inicia sesión de nuevo.',
      'User not found or inactive': 'Tu usuario no está activo o no existe.',
      'Administrator role required': 'Se requiere rol de administrador para realizar esta acción.',
      'Insufficient permissions': 'No tienes permisos para realizar esta acción.',
    };

    if (literalMap[normalized]) {
      return literalMap[normalized];
    }

    return normalized;
  }

  private getNotFoundMessage(context: SupplierRequestContext): string {
    if (context === 'products') {
      return 'No se encontraron productos para el proveedor solicitado.';
    }

    return 'El proveedor indicado no existe.';
  }

  private getConflictMessage(context: SupplierRequestContext): string {
    if (context === 'create' || context === 'update') {
      return 'Ya existe un proveedor con ese NIF/CIF o correo electrónico.';
    }

    return 'La operación no se pudo completar por un conflicto de datos.';
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

  // CRUD operations
  async getSuppliers(pageEvent?: PageEvent): Promise<{
    data: Supplier[];
    total: number;
  }> {
    return this.withErrorMapping(async () => {
      const query: Record<string, string | number | boolean> = {};

      // Backend uses page_size instead of rows.
      if (pageEvent?.page !== undefined) query['page'] = pageEvent.page;
      if (pageEvent?.rows !== undefined) query['page_size'] = pageEvent.rows;
      if (pageEvent?.query) {
        // Keep both names for backend compatibility during migration.
        query['search'] = pageEvent.query;
        query['q'] = pageEvent.query;
      }
      if (pageEvent?.status) query['status'] = pageEvent.status;
      if (pageEvent?.isActive !== undefined) {
        query['active'] = pageEvent.isActive;
        query['is_active'] = pageEvent.isActive;
      }

      const response = await firstValueFrom(
        this.http.get<SuppliersPageDto>(BASE_URL, { params: query }),
      );

      return SupplierMapper.fromPageDto(response);
    }, 'list');
  }

  async getSupplierById(id: string): Promise<Supplier> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<SupplierDetailDto>(`${BASE_URL}/${id}`));
      return SupplierMapper.fromDetailDto(dto);
    }, 'detail');
  }

  async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<SupplierDetailDto>(BASE_URL, SupplierMapper.toCreateDto(supplier)),
      );
      return SupplierMapper.fromDetailDto(dto);
    }, 'create');
  }

  async updateSupplier(id: string, supplier: UpdateSupplierRequest): Promise<Supplier> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.put<SupplierDetailDto>(`${BASE_URL}/${id}`, SupplierMapper.toUpdateDto(supplier)),
      );
      return SupplierMapper.fromDetailDto(dto);
    }, 'update');
  }

  async activateSupplier(id: string): Promise<Supplier> {
    return this.withErrorMapping(async () => {
      const body: SetSupplierActiveDto = SupplierMapper.toSetActiveDto(true);
      const response = await firstValueFrom(
        this.http.patch<SupplierDetailDto | null>(`${BASE_URL}/${id}/active`, body),
      );
      
      // If backend returns 204 No Content, reload supplier details.
      if (!response) {
        return await this.getSupplierById(id);
      }
      
      return SupplierMapper.fromDetailDto(response);
    }, 'activate');
  }

  async deactivateSupplier(id: string): Promise<Supplier> {
    return this.withErrorMapping(async () => {
      const body: SetSupplierActiveDto = SupplierMapper.toSetActiveDto(false);
      const response = await firstValueFrom(
        this.http.patch<SupplierDetailDto | null>(`${BASE_URL}/${id}/active`, body),
      );
      
      // If backend returns 204 No Content, reload supplier details.
      if (!response) {
        return await this.getSupplierById(id);
      }
      
      return SupplierMapper.fromDetailDto(response);
    }, 'deactivate');
  }

  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    return this.withErrorMapping(async () => {
      // The detail endpoint may already include products depending on backend version.
      const detailDto = await firstValueFrom(
        this.http.get<SupplierDetailDto>(`${BASE_URL}/${supplierId}`),
      );

      const supplierFromDetail = SupplierMapper.fromDetailDto(detailDto);
      if ((supplierFromDetail.products?.length ?? 0) > 0) {
        return supplierFromDetail.products ?? [];
      }

      // Backward compatibility: older backend versions expose products in /products.
      try {
        const productsDto = await firstValueFrom(
          this.http.get<SupplierProductsDto>(`${BASE_URL}/${supplierId}/products`),
        );

        return SupplierMapper.fromProductsDto(productsDto);
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return supplierFromDetail.products ?? [];
        }

        throw error;
      }
    }, 'products');
  }

  async downloadImportTemplate(): Promise<SupplierImportTemplate> {
    return this.withErrorMapping(async () => {
      const response = await firstValueFrom(
        this.http.get(`${BASE_URL}/template`, {
          responseType: 'blob',
        }),
      );

      return {
        filename: 'plantilla_proveedores.xlsx',
        data: await response.arrayBuffer(),
      };
    }, 'template');
  }

  async importSuppliers(file: File): Promise<SupplierImportExecutionResult> {
    return this.withErrorMapping(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await firstValueFrom(
        this.http.post<ImportSuppliersApiResponse>(`${BASE_URL}/import`, formData),
      );

      const errors = (response.error_detail ?? []).map((error) => ({
        row: error.row,
        reason: error.reason,
      }));

      return {
        success: response.errors === 0,
        importedCount: response.created,
        message: response.errors === 0
          ? `Se han importado ${response.created} proveedores correctamente`
          : `Se encontraron ${response.errors} errores durante la importación`,
        errors: errors.length > 0 ? errors : undefined,
      };
    }, 'import');
  }
}

