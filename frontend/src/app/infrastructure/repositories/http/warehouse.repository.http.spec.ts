import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { HttpWarehouseRepository } from './warehouse.repository.http';
import {
  WarehouseApiError,
  WarehouseAlreadyExistsError,
  WarehouseForbiddenError,
  WarehouseHasStockError,
  WarehouseNotFoundError,
  WarehouseUnauthorizedError,
  WarehouseValidationError,
} from '@domain/models/warehouse-errors';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/warehouse/warehouses`;

const WAREHOUSE_DTO = {
  warehouse_id: 1,
  name: 'Almacén Central',
  address: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postal_code: '28001',
  },
  total_stock: 42,
};

const WAREHOUSE_DOMAIN = {
  warehouseId: 1,
  name: 'Almacén Central',
  address: 'Calle Principal 123, Madrid, Madrid, 28001',
  totalStock: 42,
};

describe('HttpWarehouseRepository', () => {
  let repo: HttpWarehouseRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpWarehouseRepository],
    });

    repo = TestBed.inject(HttpWarehouseRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  // ─── getWarehouses ──────────────────────────────────────────────────────────

  describe('getWarehouses()', () => {
    it('should return a list of mapped warehouses on 200', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      const req = controller.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush([WAREHOUSE_DTO]);

      const result = await promise;
      expect(result).toEqual([WAREHOUSE_DOMAIN]);
    });

    it('should throw WarehouseUnauthorizedError on 401', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseUnauthorizedError);
    });

    it('should throw WarehouseApiError on unexpected status', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseApiError);
    });
  });

  // ─── getWarehouseById ───────────────────────────────────────────────────────

  describe('getWarehouseById()', () => {
    it('should return a mapped warehouse on 200', async () => {
      const promise = firstValueFrom(repo.getWarehouseById(1));
      const req = controller.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(WAREHOUSE_DTO);

      const result = await promise;
      expect(result).toEqual(WAREHOUSE_DOMAIN);
    });

    it('should throw WarehouseNotFoundError on 404', async () => {
      const promise = firstValueFrom(repo.getWarehouseById(999));
      controller.expectOne(`${BASE_URL}/999`).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseNotFoundError);
    });

    it('should throw WarehouseForbiddenError on 403', async () => {
      const promise = firstValueFrom(repo.getWarehouseById(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseForbiddenError);
    });
  });

  // ─── createWarehouse ────────────────────────────────────────────────────────

  describe('createWarehouse()', () => {
    const CREATE_PAYLOAD = { name: 'Almacén Central', address: 'Calle Principal 123' };

    it('should POST the correct DTO and return mapped warehouse on 201', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      const req = controller.expectOne(BASE_URL);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Almacén Central', address: 'Calle Principal 123' });
      req.flush(WAREHOUSE_DTO);

      const result = await promise;
      expect(result).toEqual(WAREHOUSE_DOMAIN);
    });

    it('should throw WarehouseValidationError on 422', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseValidationError);
    });

    it('should throw WarehouseValidationError on 400', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { message: 'Bad request' },
        { status: 400, statusText: 'Bad Request' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseValidationError);
    });

    it('should throw WarehouseAlreadyExistsError on 409 with NAME_DUPLICATE code (6102)', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { message: 'Name already taken', error_code: 6102 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseAlreadyExistsError);
    });

    it('should throw WarehouseApiError on 409 with unknown error code', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { message: 'Conflict', error_code: 9999 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseApiError);
    });
  });

  // ─── updateWarehouse ────────────────────────────────────────────────────────

  describe('updateWarehouse()', () => {
    const UPDATE_PAYLOAD = { name: 'Almacén Norte', address: 'Calle Nueva 456' };

    it('should PUT the correct DTO and return mapped warehouse on 200', async () => {
      const promise = firstValueFrom(repo.updateWarehouse(1, UPDATE_PAYLOAD));
      const req = controller.expectOne(`${BASE_URL}/1`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Almacén Norte', address: 'Calle Nueva 456' });
      req.flush({
        ...WAREHOUSE_DTO,
        name: 'Almacén Norte',
        address: {
          street: 'Calle Nueva 456',
          city: 'Madrid',
          province: 'Madrid',
          postal_code: '28002',
        },
      });

      const result = await promise;
      expect(result).toMatchObject({
        name: 'Almacén Norte',
        address: 'Calle Nueva 456, Madrid, Madrid, 28002',
      });
    });

    it('should throw WarehouseNotFoundError on 404', async () => {
      const promise = firstValueFrom(repo.updateWarehouse(999, UPDATE_PAYLOAD));
      controller.expectOne(`${BASE_URL}/999`).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseNotFoundError);
    });

    it('should throw WarehouseValidationError on 422', async () => {
      const promise = firstValueFrom(repo.updateWarehouse(1, UPDATE_PAYLOAD));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseValidationError);
    });

    it('should throw WarehouseAlreadyExistsError on 409 with NAME_DUPLICATE code (6102)', async () => {
      const promise = firstValueFrom(repo.updateWarehouse(1, UPDATE_PAYLOAD));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Duplicate name', error_code: 6102 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseAlreadyExistsError);
    });
  });

  // ─── deleteWarehouse ────────────────────────────────────────────────────────

  describe('deleteWarehouse()', () => {
    it('should send DELETE and complete on 204', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      const req = controller.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(promise).resolves.toBeNull();
    });

    it('should throw WarehouseHasStockError on 409 with HAS_STOCK code (6103)', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Has stock', error_code: 6103 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseHasStockError);
    });

    it('should throw WarehouseNotFoundError on 404', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(999));
      controller.expectOne(`${BASE_URL}/999`).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseNotFoundError);
    });

    it('should throw WarehouseForbiddenError on 403', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );
      await expect(promise).rejects.toBeInstanceOf(WarehouseForbiddenError);
    });

    it('should throw WarehouseApiError on generic non-HttpErrorResponse error', async () => {
      // Simulates a network-level error (ProgressEvent), not an HTTP status error.
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).error(new ProgressEvent('error'));
      await expect(promise).rejects.toBeInstanceOf(WarehouseApiError);
    });
  });

  // ─── error message extraction ───────────────────────────────────────────────

  describe('error message extraction', () => {
    it('should use message field from error body when present', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { message: 'Custom message from body' },
        { status: 500, statusText: 'Server Error' },
      );
      const err = await promise.catch((e) => e);
      expect(err).toBeInstanceOf(WarehouseApiError);
      expect(err.message).toBe('Custom message from body');
    });

    it('should use detail field from error body when message is absent', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { detail: 'Detail from body' },
        { status: 500, statusText: 'Server Error' },
      );
      const err = await promise.catch((e) => e);
      expect(err).toBeInstanceOf(WarehouseApiError);
      expect(err.message).toBe('Detail from body');
    });

    it('should use string error body directly', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush('Plain string error', {
        status: 500,
        statusText: 'Server Error',
      });
      const err = await promise.catch((e) => e);
      expect(err).toBeInstanceOf(WarehouseApiError);
      expect(err.message).toBe('Plain string error');
    });

    it('should fall back to the default message when body has no extractable message', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        {},
        { status: 500, statusText: 'Server Error' },
      );
      const err = await promise.catch((e) => e);
      expect(err).toBeInstanceOf(WarehouseApiError);
      expect(err.message).toBe('Error inesperado en la API de almacenes.');
    });
  });
});
