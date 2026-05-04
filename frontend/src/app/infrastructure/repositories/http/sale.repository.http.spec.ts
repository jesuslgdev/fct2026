import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleApiError,
  SaleClientNotActiveError,
  SaleClientNotFoundError,
  SaleDeliveryAddressRequiredError,
  SaleEmptyLinesError,
  SaleForbiddenError,
  SaleInsufficientStockError,
  SaleInvalidDiscountError,
  SaleInvalidStatusTransitionError,
  SaleLineNotFoundError,
  SaleMinimumOneLineError,
  SaleNotFoundError,
  SaleNotPendingError,
  SaleProductNotActiveError,
  SaleProductNotFoundError,
  SaleTerminalStateError,
  SaleUnauthorizedError,
  SaleValidationError,
  SaleWarehouseNotFoundError,
} from '@domain/models/sale-errors';
import { environment } from 'environments/environment';

import { HttpSaleRepository } from './sale.repository.http';

const BASE_URL = `${environment.apiUrl}/api/v1/sales`;

const SALE_DETAIL_DTO = {
  sale_id: 1,
  sale_number: 'SALE-0001',
  client_id: 10,
  client_name: 'Client A',
  warehouse_id: 3,
  delivery_address: 'Main St 123',
  user_id: 5,
  creator_name: 'Seller A',
  sale_date: '2024-01-01T10:00:00Z',
  status: 'Pending',
  allowed_transitions: ['Approved', 'Cancelled'],
  subtotal: '100.00',
  taxes: '21.00',
  total: '121.00',
  created_at: '2024-01-01T09:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  lines: [
    {
      sale_line_id: 101,
      sale_id: 1,
      product_id: 50,
      quantity: 2,
      unit_price: '50.00',
      discount: '0.00',
      line_subtotal: '100.00',
      vat_rate: '0.21',
      line_tax: '21.00',
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

describe('HttpSaleRepository', () => {
  let repo: HttpSaleRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpSaleRepository],
    });

    repo = TestBed.inject(HttpSaleRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('list()', () => {
    it('should map filters including search and a paginated response on 200', async () => {
      const promise = firstValueFrom(
        repo.list({
          page: 2,
          pageSize: 10,
          sortField: 'sale_number',
          sortOrder: 'asc',
          status: SaleStatus.PENDING,
          clientId: 7,
          dateFrom: new Date('2024-01-01T00:00:00.000Z'),
          dateTo: new Date('2024-01-31T23:59:59.000Z'),
          search: 'SALE-0001',
        }),
      );

      const req = controller.expectOne((request) => request.url === BASE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('page_size')).toBe('10');
      expect(req.request.params.get('sort_field')).toBe('sale_number');
      expect(req.request.params.get('sort_order')).toBe('asc');
      expect(req.request.params.get('status')).toBe(SaleStatus.PENDING);
      expect(req.request.params.get('client_id')).toBe('7');
      expect(req.request.params.get('date_from')).toBe('2024-01-01T00:00:00.000Z');
      expect(req.request.params.get('date_to')).toBe('2024-01-31T23:59:59.000Z');
      expect(req.request.params.get('search')).toBe('SALE-0001');

      req.flush({
        items: [
          {
            sale_id: 1,
            sale_number: 'SALE-0001',
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
          },
        ],
        total: 1,
        page: 2,
        page_size: 10,
      });

      await expect(promise).resolves.toEqual({
        data: [
          {
            saleId: 1,
            saleNumber: 'SALE-0001',
            clientId: 10,
            warehouseId: 3,
            clientName: 'Client A',
            creatorName: 'Seller A',
            status: SaleStatus.PENDING,
            allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
            deliveryAddress: 'Main St 123',
            saleDate: new Date('2024-01-01T10:00:00Z'),
            createdAt: new Date('2024-01-01T09:00:00Z'),
            total: 121,
          },
        ],
        total: 1,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('create()', () => {
    it('should POST the backend payload shape and map the response on 201', async () => {
      const promise = firstValueFrom(
        repo.create({
          clientId: 10,
          warehouseId: 3,
          lines: [{ productId: 50, quantity: 2, discount: 10, discountType: 'percent' }],
        }),
      );

      const req = controller.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        client_id: 10,
        warehouse_id: 3,
        lines: [
          {
            product_id: 50,
            quantity: 2,
            discount: 10,
            discount_type: 'percent',
          },
        ],
      });

      req.flush(SALE_DETAIL_DTO);

      await expect(promise).resolves.toMatchObject({
        saleId: 1,
        lines: [{ saleLineId: 101 }],
      });
    });

    it('should map 400 and 422 business-rule errors by backend error code', async () => {
      const cases = [
        { payload: { error_code: 8103 }, type: SaleClientNotActiveError },
        { payload: { error_code: 8105 }, type: SaleProductNotActiveError },
        { payload: { error_code: 8106 }, type: SaleInsufficientStockError },
        { payload: { error_code: 8107 }, type: SaleEmptyLinesError },
        { payload: { error_code: 8108 }, type: SaleInvalidStatusTransitionError },
        { payload: { error_code: 8109 }, type: SaleTerminalStateError },
        { payload: { error_code: 8111 }, type: SaleNotPendingError, status: 400 },
        { payload: { error_code: 8112 }, type: SaleDeliveryAddressRequiredError },
        { payload: { error_code: 8113 }, type: SaleInvalidDiscountError },
        { payload: { error_code: 8115 }, type: SaleMinimumOneLineError },
      ];

      for (const testCase of cases) {
        const promise = firstValueFrom(
          repo.create({ clientId: 1, warehouseId: 1, lines: [] }),
        );
        controller.expectOne(BASE_URL).flush(testCase.payload, {
          status: testCase.status ?? 422,
          statusText:
            testCase.status === 400 ? 'Bad Request' : 'Unprocessable Entity',
        });
        await expect(promise).rejects.toBeInstanceOf(testCase.type);
      }
    });

    it('should map unknown 422 payloads to SaleValidationError', async () => {
      const promise = firstValueFrom(
        repo.create({ clientId: 1, warehouseId: 1, lines: [] }),
      );

      controller.expectOne(BASE_URL).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      await expect(promise).rejects.toBeInstanceOf(SaleValidationError);
    });
  });

  describe('getById()', () => {
    it('should map the detail response on 200', async () => {
      const promise = firstValueFrom(repo.getById(1));
      const req = controller.expectOne(`${BASE_URL}/1`);

      expect(req.request.method).toBe('GET');
      req.flush(SALE_DETAIL_DTO);

      await expect(promise).resolves.toMatchObject({
        saleId: 1,
        lines: [{ saleLineId: 101 }],
      });
    });

    it('should map 401 and 403 errors', async () => {
      const unauthorized = firstValueFrom(repo.getById(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
      await expect(unauthorized).rejects.toBeInstanceOf(SaleUnauthorizedError);

      const forbidden = firstValueFrom(repo.getById(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );
      await expect(forbidden).rejects.toBeInstanceOf(SaleForbiddenError);
    });

    it('should map 404 sales errors by backend error code', async () => {
      const cases = [
        {
          payload: { message: 'Client not found', error_code: 8102 },
          errorType: SaleClientNotFoundError,
        },
        {
          payload: { message: 'Product not found', error_code: 8104 },
          errorType: SaleProductNotFoundError,
        },
        {
          payload: { message: 'Warehouse not found', error_code: 8110 },
          errorType: SaleWarehouseNotFoundError,
        },
        {
          payload: { message: 'Sale line not found', error_code: 8114 },
          errorType: SaleLineNotFoundError,
        },
        {
          payload: { detail: 'Sale not found' },
          errorType: SaleNotFoundError,
        },
      ];

      for (const testCase of cases) {
        const promise = firstValueFrom(repo.getById(1));
        controller.expectOne(`${BASE_URL}/1`).flush(testCase.payload, {
          status: 404,
          statusText: 'Not Found',
        });
        await expect(promise).rejects.toBeInstanceOf(testCase.errorType);
      }
    });

    it('should map unknown 500 payloads to SaleApiError', async () => {
      const promise = firstValueFrom(repo.getById(1));

      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      await expect(promise).rejects.toBeInstanceOf(SaleApiError);
    });
  });

  describe('update()', () => {
    it('should PUT delivery address and lines and map the response on 200', async () => {
      const promise = firstValueFrom(
        repo.update(1, {
          clientId: 12,
          deliveryAddress: 'Updated address',
          lines: [{ productId: 60, quantity: 1, discount: 5, discountType: 'amount' }],
        }),
      );

      const req = controller.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        client_id: 12,
        delivery_address: 'Updated address',
        lines: [
          {
            product_id: 60,
            quantity: 1,
            discount: 5,
            discount_type: 'amount',
          },
        ],
      });

      req.flush(SALE_DETAIL_DTO);
      await expect(promise).resolves.toMatchObject({ saleId: 1 });
    });
  });

  describe('addLine()', () => {
    it('should POST the line payload and map the response on 201', async () => {
      const promise = firstValueFrom(
        repo.addLine(1, {
          productId: 50,
          quantity: 4,
          discount: 2,
          discountType: 'amount',
        }),
      );
      const req = controller.expectOne(`${BASE_URL}/1/lines`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        product_id: 50,
        quantity: 4,
        discount: 2,
        discount_type: 'amount',
      });

      req.flush(SALE_DETAIL_DTO);
      await expect(promise).resolves.toMatchObject({ saleId: 1 });
    });
  });

  describe('updateLine()', () => {
    it('should PUT the line payload and map the response on 200', async () => {
      const promise = firstValueFrom(
        repo.updateLine(1, 101, {
          quantity: 3,
          discount: 15,
          discountType: 'percent',
        }),
      );
      const req = controller.expectOne(`${BASE_URL}/1/lines/101`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        quantity: 3,
        discount: 15,
        discount_type: 'percent',
      });

      req.flush(SALE_DETAIL_DTO);
      await expect(promise).resolves.toMatchObject({ saleId: 1 });
    });
  });

  describe('removeLine()', () => {
    it('should DELETE the sale line and map the response on 200', async () => {
      const promise = firstValueFrom(repo.removeLine(1, 101));
      const req = controller.expectOne(`${BASE_URL}/1/lines/101`);

      expect(req.request.method).toBe('DELETE');
      req.flush(SALE_DETAIL_DTO);

      await expect(promise).resolves.toMatchObject({ saleId: 1 });
    });
  });

  describe('advanceStatus()', () => {
    it('should PATCH the new status and map the response on 200', async () => {
      const promise = firstValueFrom(
        repo.advanceStatus(1, { newStatus: SaleStatus.APPROVED }),
      );
      const req = controller.expectOne(`${BASE_URL}/1/status`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ new_status: SaleStatus.APPROVED });
      req.flush(SALE_DETAIL_DTO);

      await expect(promise).resolves.toMatchObject({ saleId: 1 });
    });
  });
});
