import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { HttpStockMovementRepository } from './stock-movement.repository.http';
import {
  StockMovementApiError,
  StockMovementForbiddenError,
  StockMovementNotFoundError,
  StockMovementUnauthorizedError,
  StockMovementValidationError,
} from '@domain/models/stock-movement-errors';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse/stock/movements`;

describe('HttpStockMovementRepository', () => {
  let repo: HttpStockMovementRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpStockMovementRepository],
    });

    repo = TestBed.inject(HttpStockMovementRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should map list response and query params', async () => {
    const promise = firstValueFrom(
      repo.listMovements(
        {
          productId: 7,
          movementType: 'inbound',
          reasonSearch: '  restock  ',
          dateFrom: new Date('2026-01-01T00:00:00Z'),
          dateTo: new Date('2026-01-31T23:59:59Z'),
        },
        2,
        10,
      ),
    );

    const req = controller.expectOne((request) => request.url === BASE_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    expect(req.request.params.get('product_id')).toBe('7');
    expect(req.request.params.get('movement_type')).toBe('inbound');
    expect(req.request.params.get('reason_search')).toBe('restock');
    expect(req.request.params.get('date_from')).toBe('2026-01-01T00:00:00.000Z');
    expect(req.request.params.get('date_to')).toBe('2026-01-31T23:59:59.000Z');

    req.flush({
      items: [
        {
          movement_id: 10,
          product_id: 7,
          product_name: 'Widget',
          movement_type: 'inbound',
          difference: 5,
          reason: 'Stock replenishment',
          purchase_id: 42,
          sale_id: null,
          created_at: '2026-01-10T12:00:00Z',
        },
      ],
      total: 1,
      page: 2,
      page_size: 10,
    });

    await expect(promise).resolves.toEqual({
      data: [
        {
          movementId: 10,
          productName: 'Widget',
          movementType: 'inbound',
          difference: 5,
          reason: 'Stock replenishment',
          purchaseId: 42,
          saleId: null,
          createdAt: new Date('2026-01-10T12:00:00Z'),
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('should map detail response', async () => {
    const promise = firstValueFrom(repo.getMovementById(12));

    const req = controller.expectOne(`${BASE_URL}/12`);
    expect(req.request.method).toBe('GET');

    req.flush({
      movement_id: 12,
      warehouse_id: 2,
      warehouse_name: 'Warehouse A',
      product_id: 7,
      product_name: 'Widget',
      movement_type: 'outbound',
      previous_quantity: 15,
      new_quantity: 10,
      difference: -5,
      reason: 'Damaged items',
      purchase_id: null,
      sale_id: 99,
      user_email: 'admin@example.com',
      created_at: '2026-01-11T10:30:00Z',
    });

    await expect(promise).resolves.toEqual({
      movementId: 12,
      warehouseId: 2,
      warehouseName: 'Warehouse A',
      productId: 7,
      productName: 'Widget',
      movementType: 'outbound',
      previousQuantity: 15,
      newQuantity: 10,
      difference: -5,
      reason: 'Damaged items',
      purchaseId: null,
      saleId: 99,
      userEmail: 'admin@example.com',
      createdAt: new Date('2026-01-11T10:30:00Z'),
    });
  });

  it('should map 422 to StockMovementValidationError', async () => {
    const promise = firstValueFrom(repo.listMovements({}, 1, 20));

    controller.expectOne((request) => request.url === BASE_URL).flush(
      { detail: 'Invalid filter' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await expect(promise).rejects.toBeInstanceOf(StockMovementValidationError);
  });

  it('should map 401 to StockMovementUnauthorizedError', async () => {
    const promise = firstValueFrom(repo.getMovementById(1));

    controller.expectOne(`${BASE_URL}/1`).flush(
      { detail: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(promise).rejects.toBeInstanceOf(StockMovementUnauthorizedError);
  });

  it('should map 403 to StockMovementForbiddenError', async () => {
    const promise = firstValueFrom(repo.getMovementById(1));

    controller.expectOne(`${BASE_URL}/1`).flush(
      { detail: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promise).rejects.toBeInstanceOf(StockMovementForbiddenError);
  });

  it('should map 404 to StockMovementNotFoundError', async () => {
    const promise = firstValueFrom(repo.getMovementById(1));

    controller.expectOne(`${BASE_URL}/1`).flush(
      { detail: 'Not found' },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promise).rejects.toBeInstanceOf(StockMovementNotFoundError);
  });

  it('should map 500 to StockMovementApiError', async () => {
    const promise = firstValueFrom(repo.getMovementById(1));

    controller.expectOne(`${BASE_URL}/1`).flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    await expect(promise).rejects.toBeInstanceOf(StockMovementApiError);
  });
});
