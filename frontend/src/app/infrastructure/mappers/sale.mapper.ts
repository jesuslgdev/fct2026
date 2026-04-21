import { SaleStatus } from '@domain/enums/sale-status.enum';
import { CreateSale, ListSalesFilters, PagedResult, Sale, SaleDetail, SaleLine } from '@domain/models/sale.model';
import {
  CreateSaleRequestDTO,
  SaleDetailDTO,
  SaleDTO,
  SaleLineDTO,
  SaleStatusHistoryDTO,
  SalesPageDto,
} from '@infrastructure/dtos/sale.dto';

export class SaleMapper {
  static toDomain(dto: SaleDTO): Sale {
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

  static toDetailDomain(dto: SaleDetailDTO): SaleDetail {
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
      lines: dto.lines.map((line) => this.toLineDomain(line)),
      statusHistory: dto.status_history.map((history) => this.toStatusHistoryDomain(history)),
    };
  }

  private static toLineDomain(dto: SaleLineDTO): SaleLine {
    return {
      id: dto.sale_line_id,
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

  private static toStatusHistoryDomain(dto: SaleStatusHistoryDTO) {
    return {
      fromStatus: dto.from_status as SaleStatus | null,
      toStatus: dto.to_status as SaleStatus,
      changedAt: new Date(dto.changed_at),
      changedByUserId: dto.changed_by_user_id,
    };
  }

  static toRequest(model: CreateSale): CreateSaleRequestDTO {
    return {
      client_id: model.clientId,
      warehouse_id: model.warehouseId,
      lines: model.lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
    };
  }

  static toPagedResult(response: SalesPageDto, _filters?: ListSalesFilters): PagedResult<Sale> {
    return {
      data: response.items.map((dto) => this.toDomain(dto)),
      total: response.total,
      page: response.page,
      pageSize: response.page_size,
    };
  }
}
