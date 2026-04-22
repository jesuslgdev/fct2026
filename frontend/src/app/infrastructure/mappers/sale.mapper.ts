import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  CreateSaleLineInput,
  ListSalesFilters,
  Sale,
  SaleDetail,
  SaleLine,
  SaleStatusHistory,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
import {
  ChangeSaleStatusRequestDTO,
  CreateSaleLineRequestDTO,
  CreateSaleRequestDTO,
  SaleDetailDTO,
  SaleDTO,
  SaleLineDTO,
  SaleStatusHistoryDTO,
  SalesPageDto,
  UpdateSaleLineRequestDTO,
  UpdateSaleRequestDTO,
} from '@infrastructure/dtos/sale.dto';

export class SaleMapper {
  static fromDto(dto: SaleDTO): Sale {
    return {
      saleId: dto.sale_id,
      saleNumber: dto.sale_number,
      clientId: dto.client_id,
      warehouseId: dto.warehouse_id,
      clientName: dto.client_name,
      creatorName: dto.creator_name,
      status: dto.status as SaleStatus,
      allowedTransitions: dto.allowed_transitions.map((status) => status as SaleStatus),
      deliveryAddress: dto.delivery_address,
      saleDate: new Date(dto.sale_date),
      createdAt: new Date(dto.created_at),
      total: Number(dto.total),
    };
  }

  static fromDetailDto(dto: SaleDetailDTO): SaleDetail {
    return {
      saleId: dto.sale_id,
      saleNumber: dto.sale_number,
      clientId: dto.client_id,
      warehouseId: dto.warehouse_id,
      clientName: dto.client_name,
      creatorName: dto.creator_name,
      status: dto.status as SaleStatus,
      allowedTransitions: dto.allowed_transitions.map((status) => status as SaleStatus),
      saleDate: new Date(dto.sale_date),
      total: Number(dto.total),
      deliveryAddress: dto.delivery_address,
      userId: dto.user_id,
      subtotal: Number(dto.subtotal),
      taxes: Number(dto.taxes),
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      lines: dto.lines.map((line) => this.fromLineDto(line)),
      statusHistory: dto.status_history.map((history) => this.fromStatusHistoryDto(history)),
    };
  }

  static fromPageDto(dto: SalesPageDto) {
    return {
      data: dto.items.map((item) => this.fromDto(item)),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  }

  static toQueryParams(
    filters: ListSalesFilters,
  ): Record<string, string | number> {
    const query: Record<string, string | number> = {};

    if (filters.page !== undefined) {
      query['page'] = filters.page;
    }

    if (filters.pageSize !== undefined) {
      query['page_size'] = filters.pageSize;
    }

    if (filters.sortField) {
      query['sort_field'] = filters.sortField;
    }

    if (filters.sortOrder) {
      query['sort_order'] = filters.sortOrder;
    }

    if (filters.status) {
      query['status'] = filters.status;
    }

    if (filters.clientId !== undefined) {
      query['client_id'] = filters.clientId;
    }

    if (filters.dateFrom) {
      query['date_from'] = filters.dateFrom.toISOString();
    }

    if (filters.dateTo) {
      query['date_to'] = filters.dateTo.toISOString();
    }

    if (filters.search) {
      query['search'] = filters.search;
    }

    return query;
  }

  static toCreateDto(model: CreateSale): CreateSaleRequestDTO {
    return {
      client_id: model.clientId,
      warehouse_id: model.warehouseId,
      lines: model.lines.map((line) => this.toSaleLineDto(line)),
    };
  }

  static toUpdateDto(model: UpdateSale): UpdateSaleRequestDTO {
    return {
      client_id: model.clientId,
      delivery_address: model.deliveryAddress,
      lines: model.lines.map((line) => this.toSaleLineDto(line)),
    };
  }

  static toAddLineDto(model: AddSaleLine): CreateSaleLineRequestDTO {
    return this.toSaleLineDto(model);
  }

  static toUpdateLineDto(model: UpdateSaleLine): UpdateSaleLineRequestDTO {
    return {
      quantity: model.quantity,
      ...(model.discount !== undefined ? { discount: model.discount } : {}),
      ...(model.discountType !== undefined
        ? { discount_type: model.discountType }
        : {}),
    };
  }

  static toAdvanceStatusDto(
    model: AdvanceSaleStatus,
  ): ChangeSaleStatusRequestDTO {
    return {
      new_status: model.newStatus,
    };
  }

  private static fromLineDto(dto: SaleLineDTO): SaleLine {
    return {
      saleLineId: dto.sale_line_id,
      saleId: dto.sale_id,
      productId: dto.product_id,
      quantity: dto.quantity,
      unitPrice: Number(dto.unit_price),
      discount: Number(dto.discount),
      lineSubtotal: Number(dto.line_subtotal),
      vatRate: Number(dto.vat_rate),
      lineTax: Number(dto.line_tax),
    };
  }

  private static fromStatusHistoryDto(dto: SaleStatusHistoryDTO): SaleStatusHistory {
    return {
      fromStatus: dto.from_status as SaleStatus | null,
      toStatus: dto.to_status as SaleStatus,
      changedAt: new Date(dto.changed_at),
      changedByUserId: dto.changed_by_user_id,
    };
  }

  private static toSaleLineDto(
    line: Pick<
      CreateSaleLineInput,
      'productId' | 'quantity' | 'discount' | 'discountType'
    >,
  ): CreateSaleLineRequestDTO {
    return {
      product_id: line.productId,
      quantity: line.quantity,
      ...(line.discount !== undefined ? { discount: line.discount } : {}),
      ...(line.discountType !== undefined
        ? { discount_type: line.discountType }
        : {}),
    };
  }
}
