import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { getPurchaseStatusTransitionEffect } from '@domain/models/purchase-rules';
import {
  AddPurchaseLineRequestDto,
  AdvancePurchaseStatusRequestDto,
  BackendPurchaseStatus,
  CreatePurchaseRequestDto,
  PurchaseDetailDto,
  PurchaseLineDto,
  PurchaseListItemDto,
  PurchaseStatusHistoryDto,
  PurchasesPageDto,
  SupplierDto,
  SupplierProductDto,
  UpdatePurchaseRequestDto,
} from '@infrastructure/dtos/purchase.dto';
import { WarehouseDto } from '@infrastructure/dtos/warehouse.dto';
import {
  CreatePurchasePayload,
  PagedResult,
  PurchaseDetail,
  PurchaseLine,
  PurchaseLineInput,
  PurchaseQueryParams,
  PurchaseSortField,
  PurchaseStatusAuditEntry,
  PurchaseSummary,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
} from '@domain/models/purchase.model';

interface PurchaseWarehouseAddressDto {
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export type PurchaseWarehouseDto = Omit<WarehouseDto, 'address'> & {
  address: string | PurchaseWarehouseAddressDto | null;
};

const SORT_FIELD_TO_BACKEND: Record<PurchaseSortField, string> = {
  purchaseNumber: 'purchase_number',
  supplierName: 'supplier_name',
  status: 'status',
  deliveryAddress: 'created_at',
  createdAt: 'created_at',
  total: 'total',
};

export class PurchaseMapper {
  static toQueryParams(params: PurchaseQueryParams): Record<string, string | number | boolean> {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      page_size: params.pageSize,
    };

    if (params.status !== undefined) {
      query['status'] = this.toBackendStatus(params.status);
    }

    if (params.supplierId !== undefined) {
      query['supplier_id'] = params.supplierId;
    }

    if (params.supplierSearch !== undefined) {
      query['search'] = params.supplierSearch;
    }

    if (params.createdFrom !== undefined) {
      query['date_from'] = params.createdFrom;
    }

    if (params.createdTo !== undefined) {
      query['date_to'] = params.createdTo;
    }

    if (params.sort) {
      query['sort_field'] = SORT_FIELD_TO_BACKEND[params.sort.field];
      query['sort_order'] = params.sort.direction;
    }

    return query;
  }

  static fromSummaryDto(
    dto: PurchaseListItemDto,
    supplierId: number,
    deliveryAddress: string,
  ): PurchaseSummary {
    return {
      purchaseId: dto.purchase_id,
      purchaseNumber: dto.purchase_number,
      supplierId,
      supplierName: dto.supplier_name ?? '',
      deliveryWarehouseId: dto.warehouse_id,
      deliveryAddress,
      status: this.toDomainStatus(dto.status),
      createdAt: dto.created_at,
      total: this.toNumber(dto.total),
    };
  }

  static toPagedResult(
    pageDto: PurchasesPageDto,
    data: PurchaseSummary[],
  ): PagedResult<PurchaseSummary> {
    return {
      data,
      total: pageDto.total,
      page: pageDto.page,
      pageSize: pageDto.page_size,
    };
  }

  static fromDetailDto(dto: PurchaseDetailDto, deliveryAddress: string): PurchaseDetail {
    return {
      purchaseId: dto.purchase_id,
      purchaseNumber: dto.purchase_number,
      supplierId: dto.supplier_id,
      supplierName: dto.supplier_name ?? '',
      deliveryWarehouseId: dto.warehouse_id,
      deliveryAddress,
      status: this.toDomainStatus(dto.status),
      createdAt: dto.created_at,
      total: this.toNumber(dto.total),
      subtotal: this.toNumber(dto.subtotal),
      vatTotal: this.toNumber(dto.taxes),
      lines: dto.lines.map((line) => this.fromLineDto(line)),
      createdByUserId: dto.user_id,
      createdByName: dto.user_name ?? '',
      updatedAt: dto.updated_at,
      cancelledAt: dto.cancelled_at,
      cancelledByUserId: dto.cancelled_by_user_id,
      cancelledByName: null,
      statusHistory: this.toStatusHistory(dto),
    };
  }

  static toCreateDto(payload: CreatePurchasePayload): CreatePurchaseRequestDto {
    return {
      supplier_id: payload.supplierId,
      warehouse_id: payload.deliveryWarehouseId,
      lines: payload.lines.map((line) => this.toCreateLineDto(line)),
    };
  }

  static toUpdateDto(supplierId: number, warehouseId: number): UpdatePurchaseRequestDto {
    return {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
    };
  }

  static toAddLineDto(line: PurchaseLineInput): AddPurchaseLineRequestDto {
    return this.toCreateLineDto(line);
  }

  static toAdvanceStatusDto(status: PurchaseStatus): AdvancePurchaseStatusRequestDto {
    const backendStatus = this.toBackendStatus(status);

    if (backendStatus === 'Pending' || backendStatus === 'Cancelled') {
      throw new Error('Invalid purchase transition target for backend status endpoint.');
    }

    return { status: backendStatus };
  }

  static fromSupplierDto(dto: SupplierDto): PurchaseSupplierOption {
    return {
      supplierId: dto.supplier_id,
      supplierName: dto.name,
      isActive: dto.is_active,
    };
  }

  static fromWarehouseDto(dto: PurchaseWarehouseDto): PurchaseWarehouseOption {
    return {
      warehouseId: dto.warehouse_id,
      warehouseName: dto.name,
      address: this.formatWarehouseAddress(dto.address),
    };
  }

  static formatWarehouseAddress(address: PurchaseWarehouseDto['address']): string {
    if (typeof address === 'string') {
      return address.trim();
    }

    if (!address || typeof address !== 'object') {
      return '';
    }

    const payload = address as Partial<PurchaseWarehouseAddressDto>;
    const street = this.toAddressPart(payload.street);
    const city = this.toAddressPart(payload.city);
    const postalCode = this.toAddressPart(payload.postal_code);
    const province = this.toAddressPart(payload.province);
    const locality = [postalCode, city].filter((value) => value.length > 0).join(' ');
    const normalizedProvince =
      province.length > 0 && province.toLowerCase() === city.toLowerCase() ? '' : province;

    return [street, locality, normalizedProvince]
      .filter((value) => value.length > 0)
      .join(', ');
  }

  static toSupplierProductOption(
    supplierId: number,
    dto: SupplierProductDto,
    vatRate: number,
  ): PurchaseSupplierProductOption {
    return {
      productId: dto.product_id,
      productName: dto.product_name ?? '',
      supplierId,
      unitPrice: this.toNumber(dto.supplier_price),
      vatRate,
    };
  }

  static toDomainVatRate(vatRate: number | string | null | undefined): number {
    const normalizedVatRate = this.toNumber(vatRate);

    if (normalizedVatRate <= 1) {
      return Math.round((normalizedVatRate + Number.EPSILON) * 10000) / 100;
    }

    return normalizedVatRate;
  }

  static toDomainStatus(status: string): PurchaseStatus {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'Approved':
        return 'Approved';
      case 'In Process':
      case 'InProcess':
        return 'InProcess';
      case 'Sent':
      case 'Shipped':
        return 'Shipped';
      case 'Received':
        return 'Received';
      case 'Cancelled':
        return 'Cancelled';
      default:
        throw new Error(`Unsupported purchase status received from backend: ${status}`);
    }
  }

  static toBackendStatus(status: PurchaseStatus): Exclude<BackendPurchaseStatus, 'In Process'> {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'Approved':
        return 'Approved';
      case 'InProcess':
        return 'InProcess';
      case 'Shipped':
        return 'Sent';
      case 'Received':
        return 'Received';
      case 'Cancelled':
        return 'Cancelled';
    }
  }

  private static fromLineDto(dto: PurchaseLineDto): PurchaseLine {
    const subtotal = this.toNumber(dto.line_subtotal);
    const vatAmount = this.toNumber(dto.line_tax);

    return {
      lineId: dto.purchase_line_id,
      productId: dto.product_id,
      productName: dto.product_name ?? '',
      quantity: dto.quantity,
      unitPrice: this.toNumber(dto.unit_price),
      vatRate: this.toDomainVatRate(this.toNumber(dto.vat_rate)),
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
    };
  }

  private static toCreateLineDto(line: PurchaseLineInput): AddPurchaseLineRequestDto {
    return {
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount: 0,
    };
  }

  private static toStatusHistory(dto: PurchaseDetailDto): PurchaseStatusAuditEntry[] {
    const backendHistory = dto.status_history ?? [];

    if (backendHistory.length > 0) {
      return backendHistory
        .map((entry) => this.fromStatusHistoryDto(entry, dto))
        .sort((left, right) => Date.parse(left.changedAt) - Date.parse(right.changedAt));
    }

    return [
      {
        fromStatus: null,
        toStatus: this.toDomainStatus(dto.status),
        changedAt: dto.updated_at ?? dto.created_at,
        changedByUserId: dto.user_id,
        changedByName: dto.user_name ?? '',
        effect: 'none',
      },
    ];
  }

  private static fromStatusHistoryDto(
    dto: PurchaseStatusHistoryDto,
    purchaseDetail: PurchaseDetailDto,
  ): PurchaseStatusAuditEntry {
    const fromStatus = dto.from_status ? this.toDomainStatus(dto.from_status) : null;
    const toStatus = this.toDomainStatus(dto.to_status);

    return {
      fromStatus,
      toStatus,
      changedAt: dto.changed_at,
      changedByUserId: dto.changed_by_user_id,
      changedByName: this.resolveHistoryActorName(dto.changed_by_user_id, purchaseDetail),
      effect: fromStatus ? getPurchaseStatusTransitionEffect(fromStatus, toStatus) : 'none',
    };
  }

  private static toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsedValue =
      typeof value === 'number'
        ? value
        : Number.parseFloat(value.replace(',', '.'));

    if (!Number.isFinite(parsedValue)) {
      return 0;
    }

    return parsedValue;
  }

  private static toAddressPart(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private static resolveHistoryActorName(
    changedByUserId: number,
    purchaseDetail: PurchaseDetailDto,
  ): string {
    if (changedByUserId === purchaseDetail.user_id && purchaseDetail.user_name?.trim()) {
      return purchaseDetail.user_name.trim();
    }

    return `User #${changedByUserId}`;
  }
}
