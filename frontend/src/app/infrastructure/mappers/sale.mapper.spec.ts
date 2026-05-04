import { SaleStatus } from '@domain/enums/sale-status.enum';
import { SaleValidationError } from '@domain/models/sale-errors';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
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
        discount_type: 'amount',
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

  describe('fromDto()', () => {
    it('should map SaleDTO to Sale domain model correctly', () => {
      const result = SaleMapper.fromDto(mockSaleDTO);

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
      const result = SaleMapper.fromDto(dtoWithNumber);
      expect(result.total).toBe(121);
    });

    it('should throw SaleValidationError when status is invalid', () => {
      const invalidDto: SaleDTO = { ...mockSaleDTO, status: 'InvalidStatus' };

      expect(() => SaleMapper.fromDto(invalidDto)).toThrow(SaleValidationError);
      expect(() => SaleMapper.fromDto(invalidDto)).toThrow('Sale status is invalid.');
    });

    it('should throw SaleValidationError when an allowed transition is invalid', () => {
      const invalidDto: SaleDTO = {
        ...mockSaleDTO,
        allowed_transitions: ['Approved', 'InvalidStatus'],
      };

      expect(() => SaleMapper.fromDto(invalidDto)).toThrow(SaleValidationError);
      expect(() => SaleMapper.fromDto(invalidDto)).toThrow('Sale status is invalid.');
    });
  });

  describe('fromDetailDto()', () => {
    it('should map SaleDetailDTO to SaleDetail domain model correctly', () => {
      const result = SaleMapper.fromDetailDto(mockSaleDetailDTO);

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
      expect(result.lines[0].saleLineId).toBe(101);
      expect(result.lines[0].unitPrice).toBe(50);
      expect(result.lines[0].discount).toBe(0);
      expect(result.lines[0].discountType).toBe('amount');
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0].toStatus).toBe(SaleStatus.PENDING);
    });

    it('should throw SaleValidationError when status is invalid', () => {
      const invalidDto: SaleDetailDTO = { ...mockSaleDetailDTO, status: 'InvalidStatus' };

      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow(SaleValidationError);
      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow('Sale status is invalid.');
    });

    it('should throw SaleValidationError when status history toStatus is invalid', () => {
      const invalidDto: SaleDetailDTO = {
        ...mockSaleDetailDTO,
        status_history: [
          {
            ...mockSaleDetailDTO.status_history[0],
            to_status: 'InvalidStatus',
          },
        ],
      };

      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow(SaleValidationError);
      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow('Sale status is invalid.');
    });

    it('should throw SaleValidationError when status history fromStatus is invalid', () => {
      const invalidDto: SaleDetailDTO = {
        ...mockSaleDetailDTO,
        status_history: [
          {
            ...mockSaleDetailDTO.status_history[0],
            from_status: 'InvalidStatus',
          },
        ],
      };

      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow(SaleValidationError);
      expect(() => SaleMapper.fromDetailDto(invalidDto)).toThrow('Sale status is invalid.');
    });
  });

  describe('toCreateDto()', () => {
    it('should map CreateSale domain model to CreateSaleRequestDTO correctly', () => {
      const model: CreateSale = {
        clientId: 10,
        warehouseId: 3,
        lines: [{ productId: 50, quantity: 2, discount: 10, discountType: 'percent' }],
      };

      const result = SaleMapper.toCreateDto(model);

      expect(result.client_id).toBe(model.clientId);
      expect(result.warehouse_id).toBe(model.warehouseId);
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].product_id).toBe(50);
      expect(result.lines[0].quantity).toBe(2);
      expect(result.lines[0].discount).toBe(10);
      expect(result.lines[0].discount_type).toBe('percent');
    });

    it('should omit optional discount fields when they are undefined', () => {
      const model: CreateSale = {
        clientId: 10,
        warehouseId: 3,
        lines: [{ productId: 50, quantity: 2 }],
      };

      const result = SaleMapper.toCreateDto(model);

      expect(result.lines[0]).toEqual({
        product_id: 50,
        quantity: 2,
      });
    });
  });

  describe('toUpdateDto()', () => {
    it('should map UpdateSale to UpdateSaleRequestDTO', () => {
      const model: UpdateSale = {
        clientId: 11,
        deliveryAddress: 'Warehouse street 99',
        lines: [{ productId: 60, quantity: 4, discount: 5, discountType: 'amount' }],
      };

      expect(SaleMapper.toUpdateDto(model)).toEqual({
        client_id: 11,
        delivery_address: 'Warehouse street 99',
        lines: [
          {
            product_id: 60,
            quantity: 4,
            discount: 5,
            discount_type: 'amount',
          },
        ],
      });
    });

  });

  describe('toAddLineDto()', () => {
    it('should map AddSaleLine to SaleLineInputDTO', () => {
      const model: AddSaleLine = {
        productId: 80,
        quantity: 7,
        discount: 15,
        discountType: 'percent',
      };

      expect(SaleMapper.toAddLineDto(model)).toEqual({
        product_id: 80,
        quantity: 7,
        discount: 15,
        discount_type: 'percent',
      });
    });
  });

  describe('toUpdateLineDto()', () => {
    it('should map UpdateSaleLine to UpdateSaleLineRequestDTO', () => {
      const model: UpdateSaleLine = {
        quantity: 9,
        discount: 12,
        discountType: 'amount',
      };

      expect(SaleMapper.toUpdateLineDto(model)).toEqual({
        quantity: 9,
        discount: 12,
        discount_type: 'amount',
      });
    });
  });

  describe('toAdvanceStatusDto()', () => {
    it('should map AdvanceSaleStatus to ChangeSaleStatusRequestDTO', () => {
      const model: AdvanceSaleStatus = {
        newStatus: SaleStatus.APPROVED,
      };

      expect(SaleMapper.toAdvanceStatusDto(model)).toEqual({
        new_status: SaleStatus.APPROVED,
      });
    });
  });
});
