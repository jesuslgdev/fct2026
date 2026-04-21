import { SaleStatus } from '@domain/enums/sale-status.enum';
import { CreateSale } from '@domain/models/sale.model';
import { SaleDetailDTO, SaleDTO } from '@infrastructure/dtos/sale.dto';
import { SaleMapper } from '@infrastructure/mappers/sale.mapper';

describe('SaleMapper', () => {
  const mockSaleDTO: SaleDTO = {
    sale_id: 1,
    sale_number: 'SALE-001',
    client_id: 10,
    warehouse_id: 3,
    client_name: 'Client A',
    creator_name: 'Seller A',
    status: 'Pending',
    allowed_transitions: ['Approved', 'Cancelled'],
    sale_date: '2024-01-01T10:00:00Z',
    delivery_address: 'Main St 123',
    created_at: '2024-01-01T09:00:00Z',
    total: '121.00',
  };

  const mockSaleDetailDTO: SaleDetailDTO = {
    sale_id: 1,
    sale_number: 'SALE-001',
    client_id: 10,
    client_name: 'Client A',
    warehouse_id: 3,
    delivery_address: 'Main St 123',
    user_id: 5,
    creator_name: 'Seller A',
    sale_date: '2024-01-01T10:00:00Z',
    status: 'Pending',
    allowed_transitions: ['Approved', 'Cancelled'],
    subtotal: 100,
    taxes: 21,
    total: 121,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    lines: [
      {
        sale_line_id: 101,
        sale_id: 1,
        product_id: 50,
        quantity: 2,
        unit_price: 50,
        discount: 0,
        line_subtotal: 100,
        vat_rate: 0.21,
        line_tax: 21,
      },
    ],
    status_history: [
      {
        from_status: null,
        to_status: 'Pending',
        changed_at: '2024-01-01T09:00:00Z',
        changed_by_user_id: 5,
      },
    ],
  };

  describe('toDomain', () => {
    it('should map SaleDTO to Sale domain model correctly', () => {
      const result = SaleMapper.toDomain(mockSaleDTO);

      expect(result.saleId).toBe(mockSaleDTO.sale_id);
      expect(result.saleNumber).toBe(mockSaleDTO.sale_number);
      expect(result.clientId).toBe(mockSaleDTO.client_id);
      expect(result.warehouseId).toBe(mockSaleDTO.warehouse_id);
      expect(result.clientName).toBe(mockSaleDTO.client_name);
      expect(result.creatorName).toBe(mockSaleDTO.creator_name);
      expect(result.status).toBe(SaleStatus.PENDING);
      expect(result.allowedTransitions).toEqual([SaleStatus.APPROVED, SaleStatus.CANCELLED]);
      expect(result.deliveryAddress).toBe(mockSaleDTO.delivery_address);
      expect(result.saleDate).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.total).toBe(121);
    });

    it('should handle numeric strings and numbers for total', () => {
      const dtoWithNumber = { ...mockSaleDTO, total: 121 };
      const result = SaleMapper.toDomain(dtoWithNumber);
      expect(result.total).toBe(121);
    });
  });

  describe('toDetailDomain', () => {
    it('should map SaleDetailDTO to SaleDetail domain model correctly', () => {
      const result = SaleMapper.toDetailDomain(mockSaleDetailDTO);

      expect(result.saleId).toBe(mockSaleDetailDTO.sale_id);
      expect(result.saleNumber).toBe(mockSaleDetailDTO.sale_number);
      expect(result.clientId).toBe(mockSaleDetailDTO.client_id);
      expect(result.warehouseId).toBe(mockSaleDetailDTO.warehouse_id);
      expect(result.clientName).toBe(mockSaleDetailDTO.client_name);
      expect(result.creatorName).toBe(mockSaleDetailDTO.creator_name);
      expect(result.deliveryAddress).toBe(mockSaleDetailDTO.delivery_address);
      expect(result.userId).toBe(mockSaleDetailDTO.user_id);
      expect(result.subtotal).toBe(100);
      expect(result.taxes).toBe(21);
      expect(result.total).toBe(121);
      expect(result.allowedTransitions).toEqual([SaleStatus.APPROVED, SaleStatus.CANCELLED]);
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].id).toBe(101);
      expect(result.lines[0].unitPrice).toBe(50);
      expect(result.lines[0].discount).toBe(0);
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0].toStatus).toBe(SaleStatus.PENDING);
    });
  });

  describe('toRequest', () => {
    it('should map CreateSale domain model to CreateSaleRequestDTO correctly', () => {
      const model: CreateSale = {
        clientId: 10,
        warehouseId: 3,
        lines: [{ productId: 50, quantity: 2 }],
      };

      const result = SaleMapper.toRequest(model);

      expect(result.client_id).toBe(model.clientId);
      expect(result.warehouse_id).toBe(model.warehouseId);
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].product_id).toBe(50);
      expect(result.lines[0].quantity).toBe(2);
    });
  });
});
