import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { HttpStockDistributionRepository } from './stock-distribution.repository.http';
import {
  ProductNotActiveError,
  ProductNotFoundError,
  StockDistributionApiError,
  StockDistributionNotFoundError,
  StockDistributionValidationError,
  WarehouseNotFoundError,
} from '@domain/models/stock-distribution-errors';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse/stock`;
const ADJUST_STOCK_URL = `${BASE_URL}/adjust`;

const STOCK_ITEM_DTO = {
  warehouse_id: 1,
  warehouse_name: 'Central Warehouse',
  product_id: 10,
  product_code: 'SKU-123',
  product_name: 'Product A',
  stock: 50,
  reserved_stock: 10,
  available_stock: 40,
};

describe('HttpStockDistributionRepository', () => {
  let repo: HttpStockDistributionRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpStockDistributionRepository],
});

    repo = TestBed.inject(HttpStockDistributionRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getStockDistribution()', () => {
    it('should map a paginated response on 200', async () => {
      const promise = firstValueFrom(
        repo.getStockDistribution({ page: 1, pageSize: 20, warehouseId: 1 }),
      );

      const req = controller.expectOne((request) => request.url === BASE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('page_size')).toBe('20');
      expect(req.request.params.get('warehouse_id')).toBe('1');

      req.flush({
        items: [STOCK_ITEM_DTO],
        total: 1,
        page: 1,
        page_size: 20,
      });

      await expect(promise).resolves.toEqual({
        data: [
          {
            warehouseId: 1,
            warehouseName: 'Central Warehouse',
            productId: 10,
            productCode: 'SKU-123',
            productName: 'Product A',
            stock: 50,
            reservedStock: 10,
            availableStock: 40,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('should map productName to a best-effort search query param', async () => {
      const promise = firstValueFrom(
        repo.getStockDistribution({ page: 1, pageSize: 20, productName: 'Product A' }),
      );

      const req = controller.expectOne((request) => request.url === BASE_URL);
      expect(req.request.params.get('search')).toBe('Product A');

      req.flush({
        items: [STOCK_ITEM_DTO],
        total: 1,
        page: 1,
        page_size: 20,
      });

      await expect(promise).resolves.toMatchObject({ total: 1 });
    });

    it('should throw StockDistributionValidationError on 422', async () => {
      const promise = firstValueFrom(repo.getStockDistribution({ page: 1, pageSize: 20 }));

      controller.expectOne((request) => request.url === BASE_URL).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      await expect(promise).rejects.toBeInstanceOf(StockDistributionValidationError);
    });

    it('should throw StockDistributionNotFoundError on generic 404', async () => {
      const promise = firstValueFrom(repo.getStockDistribution({ page: 1, pageSize: 20 }));

      controller.expectOne((request) => request.url === BASE_URL).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );

      await expect(promise).rejects.toBeInstanceOf(StockDistributionNotFoundError);
    });
  });

  describe('adjustStock()', () => {
    const ADJUST_PAYLOAD = {
      warehouseId: 1,
      productId: 10,
      newQuantity: 60,
      reason: 'Stock count adjustment',
    };

    it('should POST the correct DTO and map the response on 200', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));
      const req = controller.expectOne(ADJUST_STOCK_URL);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        warehouse_id: 1,
        product_id: 10,
        new_quantity: 60,
        reason: 'Stock count adjustment',
      });

      req.flush({
        movement_id: 100,
        warehouse_id: 1,
        product_id: 10,
        previous_quantity: 50,
        new_quantity: 60,
        difference: 10,
        global_stock: 200,
        created_at: '2026-04-10T08:00:00Z',
      });

      await expect(promise).resolves.toEqual({
        movementId: 100,
        warehouseId: 1,
        productId: 10,
        previousQuantity: 50,
        newQuantity: 60,
        difference: 10,
        globalStock: 200,
        createdAt: '2026-04-10T08:00:00Z',
      });
    });

    it('should omit reason when undefined', async () => {
      const promise = firstValueFrom(
        repo.adjustStock({
          warehouseId: 1,
          productId: 10,
          newQuantity: 60,
        }),
      );

      const req = controller.expectOne(ADJUST_STOCK_URL);
      expect(req.request.body).toEqual({
        warehouse_id: 1,
        product_id: 10,
        new_quantity: 60,
      });

      req.flush({
        movement_id: 100,
        warehouse_id: 1,
        product_id: 10,
        previous_quantity: 0,
        new_quantity: 60,
        difference: 60,
        global_stock: 60,
        created_at: '2026-04-10T08:00:00Z',
      });

      await expect(promise).resolves.toMatchObject({ newQuantity: 60 });
    });

    it('should throw WarehouseNotFoundError on 404 with warehouse code', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));

      controller.expectOne(ADJUST_STOCK_URL).flush(
        { message: 'Warehouse not found', error_code: 6101 },
        { status: 404, statusText: 'Not Found' },
      );

      await expect(promise).rejects.toBeInstanceOf(WarehouseNotFoundError);
    });

    it('should throw ProductNotFoundError on 404 with product code', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));

      controller.expectOne(ADJUST_STOCK_URL).flush(
        { message: 'Product not found', error_code: 6201 },
        { status: 404, statusText: 'Not Found' },
      );

      await expect(promise).rejects.toBeInstanceOf(ProductNotFoundError);
    });

    it('should throw ProductNotActiveError on 409 with product inactive code', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));

      controller.expectOne(ADJUST_STOCK_URL).flush(
        { message: 'Product inactive', error_code: 6204 },
        { status: 409, statusText: 'Conflict' },
      );

      await expect(promise).rejects.toBeInstanceOf(ProductNotActiveError);
    });

    it('should throw StockDistributionValidationError on 400', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));

      controller.expectOne(ADJUST_STOCK_URL).flush(
        { detail: 'Bad request' },
        { status: 400, statusText: 'Bad Request' },
      );

      await expect(promise).rejects.toBeInstanceOf(StockDistributionValidationError);
    });

    it('should throw StockDistributionApiError on generic server error', async () => {
      const promise = firstValueFrom(repo.adjustStock(ADJUST_PAYLOAD));

      controller.expectOne(ADJUST_STOCK_URL).flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      await expect(promise).rejects.toBeInstanceOf(StockDistributionApiError);
    });
  });
});
