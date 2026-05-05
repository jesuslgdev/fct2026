import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleClientNotActiveError,
  SaleClientNotFoundError,
  SaleDeliveryAddressRequiredError,
  SaleEmptyLinesError,
  SaleInsufficientStockError,
  SaleInvalidDiscountError,
  SaleInvalidStatusTransitionError,
  SaleLineNotFoundError,
  SaleMinimumOneLineError,
  SaleNotDeletableError,
  SaleNotFoundError,
  SaleNotPendingError,
  SaleProductNotActiveError,
  SaleProductNotFoundError,
  SaleTerminalStateError,
  SaleValidationError,
  SaleWarehouseNotFoundError,
} from '@domain/models/sale-errors';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  CreateSaleLineInput,
  ListSalesFilters,
  PagedResult,
  Sale,
  SaleDetail,
  SaleLine,
  SaleSortField,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';

interface MockClient {
  id: number;
  name: string;
  isActive: boolean;
  deliveryAddress: string;
}

interface MockWarehouse {
  id: number;
}

interface MockProduct {
  id: number;
  isActive: boolean;
  unitPrice: number;
  vatRate: number;
  availableStock: number;
}

const LATENCY_MS = 20;

const ALLOWED_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  [SaleStatus.PENDING]: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
  [SaleStatus.APPROVED]: [SaleStatus.IN_PROCESS, SaleStatus.CANCELLED],
  [SaleStatus.IN_PROCESS]: [SaleStatus.SHIPPED, SaleStatus.CANCELLED],
  [SaleStatus.SHIPPED]: [SaleStatus.DELIVERED],
  [SaleStatus.DELIVERED]: [],
  [SaleStatus.CANCELLED]: [],
};

const MOCK_CLIENTS: MockClient[] = [
  { id: 1, name: 'Acme Corp', isActive: true, deliveryAddress: 'Calle Mayor 1, Madrid' },
  { id: 2, name: 'Beta Retail', isActive: true, deliveryAddress: 'Gran Via 55, Barcelona' },
  { id: 3, name: 'Gamma Legacy', isActive: false, deliveryAddress: 'Avenida Sur 20, Sevilla' },
];

const MOCK_WAREHOUSES: MockWarehouse[] = [{ id: 1 }, { id: 2 }];

const MOCK_PRODUCTS: MockProduct[] = [
  { id: 101, isActive: true, unitPrice: 25, vatRate: 0.21, availableStock: 50 },
  { id: 102, isActive: true, unitPrice: 12.5, vatRate: 0.21, availableStock: 100 },
  { id: 103, isActive: false, unitPrice: 9.99, vatRate: 0.1, availableStock: 20 },
];

const INITIAL_SALES: SaleDetail[] = [
  {
    saleId: 1,
    saleNumber: 'SALE-0001',
    clientId: 1,
    warehouseId: 1,
    clientName: 'Acme Corp',
    creatorName: 'Sales User',
    status: SaleStatus.PENDING,
    allowedTransitions: [...ALLOWED_TRANSITIONS[SaleStatus.PENDING]],
    deliveryAddress: 'Calle Mayor 1, Madrid',
    saleDate: new Date('2026-04-01T10:00:00.000Z'),
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
    total: 60.5,
    userId: 1,
    subtotal: 50,
    taxes: 10.5,
    updatedAt: new Date('2026-04-01T10:00:00.000Z'),
    lines: [
      {
        saleLineId: 1,
        saleId: 1,
        productId: 101,
        quantity: 2,
        unitPrice: 25,
        discount: 0,
        lineSubtotal: 50,
        vatRate: 0.21,
        lineTax: 10.5,
      },
    ],
    statusHistory: [
      {
        fromStatus: null,
        toStatus: SaleStatus.PENDING,
        changedAt: new Date('2026-04-01T10:00:00.000Z'),
        changedByUserId: 1,
      },
    ],
  },
  {
    saleId: 2,
    saleNumber: 'SALE-0002',
    clientId: 2,
    warehouseId: 1,
    clientName: 'Beta Retail',
    creatorName: 'Sales Manager',
    status: SaleStatus.APPROVED,
    allowedTransitions: [...ALLOWED_TRANSITIONS[SaleStatus.APPROVED]],
    deliveryAddress: 'Gran Via 55, Barcelona',
    saleDate: new Date('2026-04-05T15:00:00.000Z'),
    createdAt: new Date('2026-04-05T15:00:00.000Z'),
    total: 45.38,
    userId: 2,
    subtotal: 37.5,
    taxes: 7.88,
    updatedAt: new Date('2026-04-06T09:00:00.000Z'),
    lines: [
      {
        saleLineId: 2,
        saleId: 2,
        productId: 102,
        quantity: 3,
        unitPrice: 12.5,
        discount: 0,
        lineSubtotal: 37.5,
        vatRate: 0.21,
        lineTax: 7.88,
      },
    ],
    statusHistory: [
      {
        fromStatus: null,
        toStatus: SaleStatus.PENDING,
        changedAt: new Date('2026-04-05T15:00:00.000Z'),
        changedByUserId: 2,
      },
      {
        fromStatus: SaleStatus.PENDING,
        toStatus: SaleStatus.APPROVED,
        changedAt: new Date('2026-04-06T09:00:00.000Z'),
        changedByUserId: 2,
      },
    ],
  },
];

@Injectable()
export class MockSaleRepository implements SaleRepository {
  private sales: SaleDetail[] = INITIAL_SALES.map((sale) => this.cloneDetail(sale));
  private readonly productStock = new Map<number, number>(
    MOCK_PRODUCTS.map((product) => [product.id, product.availableStock])
  );
  private nextSaleId = INITIAL_SALES.length + 1;
  private nextLineId = INITIAL_SALES.flatMap((sale) => sale.lines).length + 1;

  list(filters: ListSalesFilters): Observable<PagedResult<Sale>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    let filtered = [...this.sales];

    if (filters.status) {
      filtered = filtered.filter((sale) => sale.status === filters.status);
    }

    if (filters.clientId !== undefined) {
      filtered = filtered.filter((sale) => sale.clientId === filters.clientId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((sale) => sale.saleDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((sale) => sale.saleDate <= filters.dateTo!);
    }

    if (filters.search) {
      const search = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.saleNumber.toLowerCase().includes(search) ||
          (sale.clientName ?? '').toLowerCase().includes(search)
      );
    }

    const sorted = this.sortSales(filtered, filters.sortField, filters.sortOrder);
    const total = sorted.length;
    const start = (page - 1) * pageSize;

    return of({
      data: sorted.slice(start, start + pageSize).map((sale) => this.toSaleSummary(sale)),
      total,
      page,
      pageSize,
    }).pipe(delay(LATENCY_MS));
  }

  getById(id: number): Observable<SaleDetail> {
    const sale = this.sales.find((item) => item.saleId === id);
    if (!sale) {
      return throwError(() => new SaleNotFoundError(`Sale with id ${id} was not found.`));
    }

    return of(this.cloneDetail(sale)).pipe(delay(LATENCY_MS));
  }

  create(data: CreateSale): Observable<SaleDetail> {
    const client = this.requireClient(data.clientId);
    this.requireWarehouse(data.warehouseId);
    this.validateLinesForCreateOrUpdate(data.lines);

    const now = new Date();
    const saleId = this.nextSaleId++;
    const lines = data.lines.map((line) => this.buildLineDraft(saleId, line));
    const created = this.buildSaleDetail({
      saleId,
      clientId: client.id,
      clientName: client.name,
      warehouseId: data.warehouseId,
      deliveryAddress: client.deliveryAddress,
      userId: 1,
      creatorName: 'Sales User',
      status: SaleStatus.PENDING,
      lines,
      createdAt: now,
      updatedAt: now,
      saleDate: now,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: SaleStatus.PENDING,
          changedAt: now,
          changedByUserId: 1,
        },
      ],
    });

    this.sales = [created, ...this.sales];
    return of(this.cloneDetail(created)).pipe(delay(LATENCY_MS));
  }

  update(saleId: number, data: UpdateSale): Observable<SaleDetail> {
    const sale = this.requireSale(saleId);
    this.requirePendingSale(sale);
    this.requireClient(data.clientId);
    if (!data.deliveryAddress.trim()) {
      return throwError(() => new SaleDeliveryAddressRequiredError());
    }

    this.validateLinesForCreateOrUpdate(data.lines);
    this.restoreLineStock(sale.lines);

    const lines = data.lines.map((line) => this.buildLineDraft(sale.saleId, line));
    const updated = this.recalculateSale({
      ...sale,
      clientId: data.clientId,
      clientName: this.requireClient(data.clientId).name,
      deliveryAddress: data.deliveryAddress.trim(),
      lines,
      updatedAt: new Date(),
    });

    this.replaceSale(updated);
    return of(this.cloneDetail(updated)).pipe(delay(LATENCY_MS));
  }

  cancel(saleId: number): Observable<SaleDetail> {
    return this.advanceStatus(saleId, { newStatus: SaleStatus.CANCELLED });
  }

  delete(saleId: number): Observable<void> {
    const sale = this.requireSale(saleId);
    if (sale.status !== SaleStatus.PENDING) {
      return throwError(() => new SaleNotDeletableError());
    }

    this.restoreLineStock(sale.lines);
    this.sales = this.sales.filter((item) => item.saleId !== saleId);
    return of(void 0).pipe(delay(LATENCY_MS));
  }

  addLine(saleId: number, data: AddSaleLine): Observable<SaleDetail> {
    const sale = this.requireSale(saleId);
    this.requirePendingSale(sale);

    const line = this.buildLineDraft(sale.saleId, data);
    const updated = this.recalculateSale({
      ...sale,
      lines: [...sale.lines, line],
      updatedAt: new Date(),
    });

    this.replaceSale(updated);
    return of(this.cloneDetail(updated)).pipe(delay(LATENCY_MS));
  }

  updateLine(saleId: number, saleLineId: number, data: UpdateSaleLine): Observable<SaleDetail> {
    const sale = this.requireSale(saleId);
    this.requirePendingSale(sale);

    const existingLine = sale.lines.find((line) => line.saleLineId === saleLineId);
    if (!existingLine) {
      return throwError(() => new SaleLineNotFoundError());
    }

    this.validateDiscount(data.discount, data.discountType);
    this.restoreLineStock([existingLine]);

    const updatedLine = this.buildLineFromExisting(existingLine, data);
    const updated = this.recalculateSale({
      ...sale,
      lines: sale.lines.map((line) =>
        line.saleLineId === saleLineId ? updatedLine : line
      ),
      updatedAt: new Date(),
    });

    this.replaceSale(updated);
    return of(this.cloneDetail(updated)).pipe(delay(LATENCY_MS));
  }

  removeLine(saleId: number, saleLineId: number): Observable<SaleDetail> {
    const sale = this.requireSale(saleId);
    this.requirePendingSale(sale);

    const line = sale.lines.find((item) => item.saleLineId === saleLineId);
    if (!line) {
      return throwError(() => new SaleLineNotFoundError());
    }

    if (sale.lines.length === 1) {
      return throwError(() => new SaleMinimumOneLineError());
    }

    this.restoreLineStock([line]);
    const updated = this.recalculateSale({
      ...sale,
      lines: sale.lines.filter((item) => item.saleLineId !== saleLineId),
      updatedAt: new Date(),
    });

    this.replaceSale(updated);
    return of(this.cloneDetail(updated)).pipe(delay(LATENCY_MS));
  }

  advanceStatus(saleId: number, data: AdvanceSaleStatus): Observable<SaleDetail> {
    const sale = this.requireSale(saleId);
    const allowed = ALLOWED_TRANSITIONS[sale.status];

    if (!allowed.length) {
      return throwError(() => new SaleTerminalStateError());
    }

    if (!allowed.includes(data.newStatus)) {
      return throwError(() => new SaleInvalidStatusTransitionError());
    }

    const changedAt = new Date();
    const updated = this.recalculateSale({
      ...sale,
      status: data.newStatus,
      updatedAt: changedAt,
      statusHistory: [
        ...sale.statusHistory,
        {
          fromStatus: sale.status,
          toStatus: data.newStatus,
          changedAt,
          changedByUserId: sale.userId,
        },
      ],
    });

    this.replaceSale(updated);
    return of(this.cloneDetail(updated)).pipe(delay(LATENCY_MS));
  }

  private validateLinesForCreateOrUpdate(lines: CreateSaleLineInput[]): void {
    if (!lines.length) {
      throw new SaleEmptyLinesError();
    }

    lines.forEach((line) => {
      if (line.productId <= 0 || line.quantity <= 0) {
        throw new SaleValidationError({ line }, 'All lines must be valid.');
      }
      this.validateDiscount(line.discount, line.discountType);
    });
  }

  private validateDiscount(
    discount: number | undefined,
    discountType: 'percent' | 'amount' | undefined
  ): void {
    if (discount === undefined) {
      return;
    }

    if (discount < 0) {
      throw new SaleInvalidDiscountError('Discount must be greater than or equal to 0.');
    }

    if (discountType === 'percent' && discount >= 100) {
      throw new SaleInvalidDiscountError('Percentage discount must be less than 100.');
    }
  }

  private buildLineDraft(
    saleId: number,
    line: Pick<CreateSaleLineInput, 'productId' | 'quantity' | 'discount' | 'discountType'>
  ): SaleLine {
    const product = this.requireProduct(line.productId);
    const currentStock = this.productStock.get(product.id) ?? 0;

    if (line.quantity > currentStock) {
      throw new SaleInsufficientStockError(
        `Insufficient stock for product ${product.id}. Requested ${line.quantity}, available ${currentStock}.`
      );
    }

    this.productStock.set(product.id, currentStock - line.quantity);

    return this.computeLine({
      saleLineId: this.nextLineId++,
      saleId,
      productId: product.id,
      quantity: line.quantity,
      unitPrice: product.unitPrice,
      discount: line.discount ?? 0,
      discountType: line.discountType ?? 'percent',
      vatRate: product.vatRate,
    });
  }

  private buildLineFromExisting(
    existingLine: SaleLine,
    data: UpdateSaleLine
  ): SaleLine {
    const product = this.requireProduct(existingLine.productId);
    const currentStock = this.productStock.get(product.id) ?? 0;

    if (data.quantity > currentStock) {
      throw new SaleInsufficientStockError(
        `Insufficient stock for product ${product.id}. Requested ${data.quantity}, available ${currentStock}.`
      );
    }

    this.productStock.set(product.id, currentStock - data.quantity);

    return this.computeLine({
      saleLineId: existingLine.saleLineId,
      saleId: existingLine.saleId,
      productId: existingLine.productId,
      quantity: data.quantity,
      unitPrice: existingLine.unitPrice,
      discount: data.discount ?? 0,
      discountType: data.discountType ?? 'percent',
      vatRate: existingLine.vatRate,
    });
  }

  private computeLine(input: {
    saleLineId: number;
    saleId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: 'percent' | 'amount';
    vatRate: number;
  }): SaleLine {
    const grossSubtotal = input.quantity * input.unitPrice;
    const discountValue =
      input.discountType === 'percent'
        ? grossSubtotal * (input.discount / 100)
        : input.discount;

    if (discountValue > grossSubtotal) {
      throw new SaleInvalidDiscountError();
    }

    const lineSubtotal = this.round2(grossSubtotal - discountValue);
    const lineTax = this.round2(lineSubtotal * input.vatRate);

    return {
      saleLineId: input.saleLineId,
      saleId: input.saleId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      discount: input.discount,
      lineSubtotal,
      vatRate: input.vatRate,
      lineTax,
    };
  }

  private buildSaleDetail(input: {
    saleId: number;
    clientId: number;
    clientName: string;
    warehouseId: number;
    deliveryAddress: string;
    userId: number;
    creatorName: string;
    status: SaleStatus;
    lines: SaleLine[];
    createdAt: Date;
    updatedAt: Date;
    saleDate: Date;
    statusHistory: SaleDetail['statusHistory'];
  }): SaleDetail {
    return this.recalculateSale({
      saleId: input.saleId,
      saleNumber: `SALE-${String(input.saleId).padStart(4, '0')}`,
      clientId: input.clientId,
      warehouseId: input.warehouseId,
      clientName: input.clientName,
      creatorName: input.creatorName,
      status: input.status,
      allowedTransitions: [...ALLOWED_TRANSITIONS[input.status]],
      deliveryAddress: input.deliveryAddress,
      saleDate: input.saleDate,
      createdAt: input.createdAt,
      total: 0,
      userId: input.userId,
      subtotal: 0,
      taxes: 0,
      updatedAt: input.updatedAt,
      lines: input.lines,
      statusHistory: input.statusHistory,
    });
  }

  private recalculateSale(sale: SaleDetail): SaleDetail {
    const subtotal = this.round2(
      sale.lines.reduce((acc, line) => acc + line.lineSubtotal, 0)
    );
    const taxes = this.round2(sale.lines.reduce((acc, line) => acc + line.lineTax, 0));

    return {
      ...sale,
      allowedTransitions: [...ALLOWED_TRANSITIONS[sale.status]],
      subtotal,
      taxes,
      total: this.round2(subtotal + taxes),
    };
  }

  private requireSale(saleId: number): SaleDetail {
    const sale = this.sales.find((item) => item.saleId === saleId);
    if (!sale) {
      throw new SaleNotFoundError();
    }
    return this.cloneDetail(sale);
  }

  private requireClient(clientId: number): MockClient {
    const client = MOCK_CLIENTS.find((item) => item.id === clientId);
    if (!client) {
      throw new SaleClientNotFoundError();
    }
    if (!client.isActive) {
      throw new SaleClientNotActiveError();
    }
    return client;
  }

  private requireWarehouse(warehouseId: number): void {
    if (!MOCK_WAREHOUSES.some((warehouse) => warehouse.id === warehouseId)) {
      throw new SaleWarehouseNotFoundError();
    }
  }

  private requireProduct(productId: number): MockProduct {
    const product = MOCK_PRODUCTS.find((item) => item.id === productId);
    if (!product) {
      throw new SaleProductNotFoundError();
    }
    if (!product.isActive) {
      throw new SaleProductNotActiveError();
    }
    return product;
  }

  private requirePendingSale(sale: SaleDetail): void {
    if (sale.status !== SaleStatus.PENDING) {
      throw new SaleNotPendingError();
    }
  }

  private restoreLineStock(lines: SaleLine[]): void {
    lines.forEach((line) => {
      const currentStock = this.productStock.get(line.productId) ?? 0;
      this.productStock.set(line.productId, currentStock + line.quantity);
    });
  }

  private replaceSale(updated: SaleDetail): void {
    this.sales = this.sales.map((sale) =>
      sale.saleId === updated.saleId ? this.cloneDetail(updated) : sale
    );
  }

  private sortSales(
    sales: SaleDetail[],
    sortField: SaleSortField | undefined,
    sortOrder: 'asc' | 'desc' | undefined
  ): SaleDetail[] {
    const direction = sortOrder === 'asc' ? 1 : -1;
    const sorted = [...sales].sort((a, b) => {
      switch (sortField) {
        case 'sale_number':
          return a.saleNumber.localeCompare(b.saleNumber);
        case 'client_name':
          return (a.clientName ?? '').localeCompare(b.clientName ?? '');
        case 'status':
          return a.status.localeCompare(b.status);
        case 'sale_date':
          return a.saleDate.getTime() - b.saleDate.getTime();
        case 'total':
          return a.total - b.total;
        case 'created_at':
        default:
          return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });

    return direction === 1 ? sorted : sorted.reverse();
  }

  private toSaleSummary(sale: SaleDetail): Sale {
    return {
      saleId: sale.saleId,
      saleNumber: sale.saleNumber,
      clientId: sale.clientId,
      warehouseId: sale.warehouseId,
      clientName: sale.clientName,
      creatorName: sale.creatorName,
      status: sale.status,
      allowedTransitions: [...sale.allowedTransitions],
      deliveryAddress: sale.deliveryAddress,
      saleDate: new Date(sale.saleDate),
      createdAt: new Date(sale.createdAt),
      total: sale.total,
    };
  }

  private cloneDetail(sale: SaleDetail): SaleDetail {
    return {
      ...sale,
      saleDate: new Date(sale.saleDate),
      createdAt: new Date(sale.createdAt),
      updatedAt: new Date(sale.updatedAt),
      allowedTransitions: [...sale.allowedTransitions],
      lines: sale.lines.map((line) => ({ ...line })),
      statusHistory: sale.statusHistory.map((history) => ({
        ...history,
        changedAt: new Date(history.changedAt),
      })),
    };
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
