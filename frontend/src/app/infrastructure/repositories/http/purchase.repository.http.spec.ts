import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { HttpPurchaseRepository } from './purchase.repository.http';
import {
  PurchaseInvalidStatusTransitionError,
  PurchaseNotFoundError,
} from '@domain/models/purchase-errors';
import { environment } from 'environments/environment';

const PURCHASES_URL = `${environment.apiUrl}/api/v1/purchases`;
const WAREHOUSES_URL = `${environment.apiUrl}/api/v1/warehouse/warehouses`;
const SUPPLIERS_URL = `${environment.apiUrl}/api/v1/suppliers`;
const CATALOG_PRODUCTS_URL = `${environment.apiUrl}/api/v1/catalog/products`;

describe('HttpPurchaseRepository', () => {
  let repo: HttpPurchaseRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpPurchaseRepository],
    });

    repo = TestBed.inject(HttpPurchaseRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('getPurchases maps query params and enriches supplierId and deliveryAddress', async () => {
    const promise = firstValueFrom(
      repo.getPurchases({
        page: 2,
        pageSize: 20,
        status: 'InProcess',
        supplierId: 10,
        supplierSearch: 'north',
        createdFrom: '2026-01-01T00:00:00.000Z',
        createdTo: '2026-12-31T23:59:59.000Z',
        sort: { field: 'createdAt', direction: 'desc' },
      }),
    );

    const listReq = controller.expectOne((req) => req.url === PURCHASES_URL);
    expect(listReq.request.method).toBe('GET');
    expect(listReq.request.params.get('page')).toBe('2');
    expect(listReq.request.params.get('page_size')).toBe('20');
    expect(listReq.request.params.get('status')).toBe('In Process');
    expect(listReq.request.params.get('supplier_id')).toBe('10');
    expect(listReq.request.params.get('search')).toBe('north');
    expect(listReq.request.params.get('date_from')).toBe('2026-01-01T00:00:00.000Z');
    expect(listReq.request.params.get('date_to')).toBe('2026-12-31T23:59:59.000Z');
    expect(listReq.request.params.get('sort_field')).toBe('created_at');
    expect(listReq.request.params.get('sort_order')).toBe('desc');

    listReq.flush({
      items: [
        {
          purchase_id: 7,
          purchase_number: 'COM-2026-0007',
          supplier_name: 'Supplier North',
          status: 'In Process',
          warehouse_id: 2,
          created_at: '2026-04-10T10:00:00.000Z',
          total: 121,
        },
      ],
      total: 1,
      page: 2,
      page_size: 20,
    });

    controller.expectOne(`${PURCHASES_URL}/7`).flush({
      purchase_id: 7,
      purchase_number: 'COM-2026-0007',
      supplier_id: 10,
      supplier_name: 'Supplier North',
      user_id: 5,
      user_name: 'Buyer User',
      warehouse_id: 2,
      warehouse_name: 'Central',
      purchase_date: '2026-04-10T10:00:00.000Z',
      status: 'In Process',
      subtotal: 100,
      taxes: 21,
      total: 121,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T10:00:00.000Z',
      updated_at: '2026-04-10T10:00:00.000Z',
      lines: [],
    });

    controller.expectOne(WAREHOUSES_URL).flush([
      {
        warehouse_id: 2,
        name: 'Central',
        address: {
          street: 'Main Street 1',
          city: 'Madrid',
          province: 'Madrid',
          postal_code: '28001',
        },
        total_stock: 0,
      },
    ]);

    const result = await promise;

    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.data[0]).toEqual({
      purchaseId: 7,
      purchaseNumber: 'COM-2026-0007',
      supplierId: 10,
      supplierName: 'Supplier North',
      deliveryWarehouseId: 2,
      deliveryAddress: 'Main Street 1, 28001 Madrid, Madrid',
      status: 'InProcess',
      createdAt: '2026-04-10T10:00:00.000Z',
      total: 121,
    });
  });

  it('getPurchaseById maps backend status and line VAT values', async () => {
    const promise = firstValueFrom(repo.getPurchaseById(3));

    controller.expectOne(`${PURCHASES_URL}/3`).flush({
      purchase_id: 3,
      purchase_number: 'COM-2026-0003',
      supplier_id: 22,
      supplier_name: 'Supplier East',
      user_id: 9,
      user_name: 'Buyer',
      warehouse_id: 1,
      warehouse_name: 'Main',
      purchase_date: '2026-04-11T08:00:00.000Z',
      status: 'Sent',
      subtotal: 50,
      taxes: 10.5,
      total: 60.5,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-11T08:00:00.000Z',
      updated_at: '2026-04-11T08:00:00.000Z',
      lines: [
        {
          purchase_line_id: 1,
          purchase_id: 3,
          product_id: 99,
          product_name: 'Paper',
          quantity: 5,
          unit_price: 10,
          discount: 0,
          line_subtotal: 50,
          vat_rate: 0.21,
          line_tax: 10.5,
        },
      ],
    });

    controller.expectOne(WAREHOUSES_URL).flush([
      {
        warehouse_id: 1,
        name: 'Main',
        address: {
          street: 'Warehouse Ave 5',
          city: 'Barcelona',
          province: 'Barcelona',
          postal_code: '08001',
        },
        total_stock: 0,
      },
    ]);

    const result = await promise;

    expect(result.status).toBe('Shipped');
    expect(result.deliveryAddress).toBe('Warehouse Ave 5, 08001 Barcelona, Barcelona');
    expect(result.lines[0].vatRate).toBe(21);
    expect(result.lines[0].total).toBe(60.5);
  });

  it('createPurchase sends backend payload and then fetches enriched detail', async () => {
    const promise = firstValueFrom(
      repo.createPurchase({
        supplierId: 11,
        deliveryWarehouseId: 2,
        lines: [{ productId: 20, quantity: 3, unitPrice: 7, vatRate: 21 }],
      }),
    );

    const createReq = controller.expectOne(PURCHASES_URL);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({
      supplier_id: 11,
      warehouse_id: 2,
      lines: [{ product_id: 20, quantity: 3, unit_price: 7, discount: 0 }],
    });

    createReq.flush({
      purchase_id: 8,
      purchase_number: 'COM-2026-0008',
      supplier_id: 11,
      supplier_name: null,
      user_id: 1,
      user_name: null,
      warehouse_id: 2,
      warehouse_name: null,
      purchase_date: '2026-04-12T08:00:00.000Z',
      status: 'Pending',
      subtotal: 21,
      taxes: 4.41,
      total: 25.41,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-12T08:00:00.000Z',
      updated_at: '2026-04-12T08:00:00.000Z',
      lines: [],
    });

    controller.expectOne(`${PURCHASES_URL}/8`).flush({
      purchase_id: 8,
      purchase_number: 'COM-2026-0008',
      supplier_id: 11,
      supplier_name: 'Supplier South',
      user_id: 1,
      user_name: 'Buyer',
      warehouse_id: 2,
      warehouse_name: 'Central',
      purchase_date: '2026-04-12T08:00:00.000Z',
      status: 'Pending',
      subtotal: 21,
      taxes: 4.41,
      total: 25.41,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-12T08:00:00.000Z',
      updated_at: '2026-04-12T08:00:00.000Z',
      lines: [],
    });

    controller.expectOne(WAREHOUSES_URL).flush([
      {
        warehouse_id: 2,
        name: 'Central',
        address: {
          street: 'Road 2',
          city: 'Valencia',
          province: 'Valencia',
          postal_code: '46001',
        },
        total_stock: 0,
      },
    ]);

    const result = await promise;
    expect(result.purchaseId).toBe(8);
    expect(result.supplierName).toBe('Supplier South');
    expect(result.deliveryAddress).toBe('Road 2, 46001 Valencia, Valencia');
  });

  it('updatePurchase replaces existing lines when payload includes lines', async () => {
    const promise = firstValueFrom(
      repo.updatePurchase(9, {
        supplierId: 15,
        lines: [{ productId: 55, quantity: 2, unitPrice: 10, vatRate: 21 }],
      }),
    );

    controller.expectOne(`${PURCHASES_URL}/9`).flush({
      purchase_id: 9,
      purchase_number: 'COM-2026-0009',
      supplier_id: 14,
      supplier_name: 'Supplier West',
      user_id: 2,
      user_name: 'Buyer',
      warehouse_id: 3,
      warehouse_name: 'North',
      purchase_date: '2026-04-10T08:00:00.000Z',
      status: 'Pending',
      subtotal: 100,
      taxes: 21,
      total: 121,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T08:00:00.000Z',
      updated_at: '2026-04-10T08:00:00.000Z',
      lines: [],
    });

    controller.expectOne(WAREHOUSES_URL).flush([
      {
        warehouse_id: 3,
        name: 'North',
        address: {
          street: 'North 3',
          city: 'Sevilla',
          province: 'Sevilla',
          postal_code: '41001',
        },
        total_stock: 0,
      },
    ]);

    const updateReq = controller.expectOne(`${PURCHASES_URL}/9`);
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ supplier_id: 15, warehouse_id: 3 });

    updateReq.flush({
      purchase_id: 9,
      purchase_number: 'COM-2026-0009',
      supplier_id: 15,
      supplier_name: null,
      user_id: 2,
      user_name: null,
      warehouse_id: 3,
      warehouse_name: null,
      purchase_date: '2026-04-10T08:00:00.000Z',
      status: 'Pending',
      subtotal: 0,
      taxes: 0,
      total: 0,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T08:00:00.000Z',
      updated_at: '2026-04-10T09:00:00.000Z',
      lines: [
        {
          purchase_line_id: 200,
          purchase_id: 9,
          product_id: 1,
          product_name: 'Old line',
          quantity: 1,
          unit_price: 10,
          discount: 0,
          line_subtotal: 10,
          vat_rate: 0.21,
          line_tax: 2.1,
        },
      ],
    });

    const deleteReq = controller.expectOne(`${PURCHASES_URL}/9/lines/200`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({
      purchase_id: 9,
      purchase_number: 'COM-2026-0009',
      supplier_id: 15,
      supplier_name: null,
      user_id: 2,
      user_name: null,
      warehouse_id: 3,
      warehouse_name: null,
      purchase_date: '2026-04-10T08:00:00.000Z',
      status: 'Pending',
      subtotal: 0,
      taxes: 0,
      total: 0,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T08:00:00.000Z',
      updated_at: '2026-04-10T09:00:00.000Z',
      lines: [],
    });

    const addReq = controller.expectOne(`${PURCHASES_URL}/9/lines`);
    expect(addReq.request.method).toBe('POST');
    expect(addReq.request.body).toEqual({
      product_id: 55,
      quantity: 2,
      unit_price: 10,
      discount: 0,
    });
    addReq.flush({
      purchase_id: 9,
      purchase_number: 'COM-2026-0009',
      supplier_id: 15,
      supplier_name: null,
      user_id: 2,
      user_name: null,
      warehouse_id: 3,
      warehouse_name: null,
      purchase_date: '2026-04-10T08:00:00.000Z',
      status: 'Pending',
      subtotal: 20,
      taxes: 4.2,
      total: 24.2,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T08:00:00.000Z',
      updated_at: '2026-04-10T09:05:00.000Z',
      lines: [],
    });

    controller.expectOne(`${PURCHASES_URL}/9`).flush({
      purchase_id: 9,
      purchase_number: 'COM-2026-0009',
      supplier_id: 15,
      supplier_name: 'Supplier Prime',
      user_id: 2,
      user_name: 'Buyer',
      warehouse_id: 3,
      warehouse_name: 'North',
      purchase_date: '2026-04-10T08:00:00.000Z',
      status: 'Pending',
      subtotal: 20,
      taxes: 4.2,
      total: 24.2,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: '2026-04-10T08:00:00.000Z',
      updated_at: '2026-04-10T09:05:00.000Z',
      lines: [],
    });

    controller.expectOne(WAREHOUSES_URL).flush([
      {
        warehouse_id: 3,
        name: 'North',
        address: {
          street: 'North 3',
          city: 'Sevilla',
          province: 'Sevilla',
          postal_code: '41001',
        },
        total_stock: 0,
      },
    ]);

    const result = await promise;
    expect(result.supplierId).toBe(15);
    expect(result.total).toBe(24.2);
  });

  it('getSupplierProducts enriches supplier prices with VAT from catalog products', async () => {
    const promise = firstValueFrom(repo.getSupplierProducts(30));

    const supplierProductsReq = controller.expectOne(
      `${SUPPLIERS_URL}/30/products?page=1&page_size=100`,
    );
    expect(supplierProductsReq.request.method).toBe('GET');
    supplierProductsReq.flush({
      items: [
        {
          product_id: 100,
          product_name: 'Screws',
          product_code: 'SCR-01',
          category_name: 'Hardware',
          supplier_price: 2,
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
    });

    controller.expectOne(`${CATALOG_PRODUCTS_URL}/100`).flush({
      product_id: 100,
      product_code: 'SCR-01',
      name: 'Screws',
      description: null,
      category_id: 1,
      category_name: 'Hardware',
      price: 3,
      vat_rate: 0.21,
      stock_current: 10,
      stock_min: 2,
      is_active: true,
    });

    const result = await promise;

    expect(result).toEqual([
      {
        productId: 100,
        productName: 'Screws',
        supplierId: 30,
        unitPrice: 2,
        vatRate: 21,
      },
    ]);
  });

  it('changePurchaseStatus maps backend invalid transition code to domain error', async () => {
    const promise = firstValueFrom(
      repo.changePurchaseStatus(15, {
        toStatus: 'Received',
        changedByUserId: 9,
        changedByName: 'Manager',
      }),
    );

    const req = controller.expectOne(`${PURCHASES_URL}/15/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Received' });

    req.flush(
      { error_code: 7113, detail: 'This status transition is not allowed' },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(promise).rejects.toBeInstanceOf(PurchaseInvalidStatusTransitionError);
  });

  it('deletePurchase maps 404 to PurchaseNotFoundError', async () => {
    const promise = firstValueFrom(repo.deletePurchase(999));

    controller.expectOne(`${PURCHASES_URL}/999`).flush(
      { error_code: 7101, detail: 'Purchase not found' },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promise).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
