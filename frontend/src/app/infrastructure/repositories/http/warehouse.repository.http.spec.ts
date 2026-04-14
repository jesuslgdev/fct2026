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
  name: 'Almacen Central',
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
  name: 'Almacen Central',
  address: 'Calle Principal 123, Madrid, Madrid, 28001',
  addressData: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
  },
  totalStock: 42,
};

const CREATE_PAYLOAD = {
  name: 'Almacen Central',
  address: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
  },
};

const CREATE_DTO = {
  name: 'Almacen Central',
  address: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postal_code: '28001',
  },
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

  describe('getWarehouses()', () => {
    it('returns mapped warehouses on 200', async () => {
      const promise = firstValueFrom(repo.getWarehouses());
      const req = controller.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush([WAREHOUSE_DTO]);

      await expect(promise).resolves.toEqual([WAREHOUSE_DOMAIN]);
    });

    it('maps common read errors', async () => {
      const unauthorized = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
      await expect(unauthorized).rejects.toBeInstanceOf(WarehouseUnauthorizedError);

      const unexpected = firstValueFrom(repo.getWarehouses());
      controller.expectOne(BASE_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
      await expect(unexpected).rejects.toBeInstanceOf(WarehouseApiError);
    });
  });

  describe('getWarehouseById()', () => {
    it('returns a mapped warehouse on 200', async () => {
      const promise = firstValueFrom(repo.getWarehouseById(1));
      const req = controller.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(WAREHOUSE_DTO);

      await expect(promise).resolves.toEqual(WAREHOUSE_DOMAIN);
    });

    it('maps 404 and 403 errors', async () => {
      const notFound = firstValueFrom(repo.getWarehouseById(999));
      controller.expectOne(`${BASE_URL}/999`).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      await expect(notFound).rejects.toBeInstanceOf(WarehouseNotFoundError);

      const forbidden = firstValueFrom(repo.getWarehouseById(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );
      await expect(forbidden).rejects.toBeInstanceOf(WarehouseForbiddenError);
    });
  });

  describe('createWarehouse()', () => {
    it('posts the API address object and returns a mapped warehouse on 201', async () => {
      const promise = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      const req = controller.expectOne(BASE_URL);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(CREATE_DTO);
      req.flush(WAREHOUSE_DTO);

      await expect(promise).resolves.toEqual(WAREHOUSE_DOMAIN);
    });

    it('maps create errors', async () => {
      const validation = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await expect(validation).rejects.toBeInstanceOf(WarehouseValidationError);

      const duplicate = firstValueFrom(repo.createWarehouse(CREATE_PAYLOAD));
      controller.expectOne(BASE_URL).flush(
        { message: 'Name already taken', error_code: 6102 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(duplicate).rejects.toBeInstanceOf(WarehouseAlreadyExistsError);
    });
  });

  describe('updateWarehouse()', () => {
    it('puts the API address object and returns a mapped warehouse on 200', async () => {
      const promise = firstValueFrom(repo.updateWarehouse(1, CREATE_PAYLOAD));
      const req = controller.expectOne(`${BASE_URL}/1`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(CREATE_DTO);
      req.flush(WAREHOUSE_DTO);

      await expect(promise).resolves.toEqual(WAREHOUSE_DOMAIN);
    });

    it('maps update errors', async () => {
      const notFound = firstValueFrom(repo.updateWarehouse(999, CREATE_PAYLOAD));
      controller.expectOne(`${BASE_URL}/999`).flush(
        { detail: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      await expect(notFound).rejects.toBeInstanceOf(WarehouseNotFoundError);

      const validation = firstValueFrom(repo.updateWarehouse(1, CREATE_PAYLOAD));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await expect(validation).rejects.toBeInstanceOf(WarehouseValidationError);
    });
  });

  describe('deleteWarehouse()', () => {
    it('sends DELETE and completes on 204', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      const req = controller.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(promise).resolves.toBeNull();
    });

    it('maps delete errors', async () => {
      const hasStock = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Has stock', error_code: 6103 },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(hasStock).rejects.toBeInstanceOf(WarehouseHasStockError);

      const forbidden = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );
      await expect(forbidden).rejects.toBeInstanceOf(WarehouseForbiddenError);
    });

    it('maps network errors to WarehouseApiError', async () => {
      const promise = firstValueFrom(repo.deleteWarehouse(1));
      controller.expectOne(`${BASE_URL}/1`).error(new ProgressEvent('error'));
      await expect(promise).rejects.toBeInstanceOf(WarehouseApiError);
    });
  });
});
