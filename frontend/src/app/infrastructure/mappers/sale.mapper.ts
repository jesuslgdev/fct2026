import { SaleStatus } from '../../domain/enums/sale-status.enum';
import { CreateSale, Sale, SaleDetail, SaleLine } from '../../domain/models/sale.model';
import { CreateSaleRequestDTO, SaleDetailDTO, SaleDTO, SaleLineDTO } from '../dtos/sale.dto';

export class SaleMapper {
  static toDomain(dto: SaleDTO): Sale {
    return {
      id: dto.sale_id,
      saleNumber: dto.sale_number,
      clientId: dto.client_id,
      clientName: dto.client_name,
      status: dto.status as SaleStatus,
      saleDate: new Date(dto.sale_date),
      total: Number(dto.total),
    };
  }

  static toDetailDomain(dto: SaleDetailDTO): SaleDetail {
    return {
      id: dto.sale_id,
      saleNumber: dto.sale_number,
      clientId: dto.client_id,
      clientName: dto.client_name,
      status: dto.status as SaleStatus,
      saleDate: new Date(dto.sale_date),
      total: Number(dto.total),
      deliveryAddress: dto.delivery_address,
      userId: dto.user_id,
      subtotal: Number(dto.subtotal),
      taxes: Number(dto.taxes),
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      lines: dto.lines.map((line) => this.toLineDomain(line)),
    };
  }

  private static toLineDomain(dto: SaleLineDTO): SaleLine {
    return {
      id: dto.sale_line_id,
      saleId: dto.sale_id,
      productId: dto.product_id,
      quantity: dto.quantity,
      unitPrice: Number(dto.unit_price),
      lineSubtotal: Number(dto.line_subtotal),
      vatRate: Number(dto.vat_rate),
      lineTax: Number(dto.line_tax),
    };
  }

  static toRequest(model: CreateSale): CreateSaleRequestDTO {
    return {
      client_id: model.clientId,
      lines: model.lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
    };
  }
}
