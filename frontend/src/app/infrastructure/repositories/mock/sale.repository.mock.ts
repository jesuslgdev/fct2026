import { Injectable } from '@angular/core';
import {
  SaleClientNotActiveError,
  SaleClientNotFoundError,
  SaleEmptyLinesError,
  SaleInsufficientStockError,
  SaleNotFoundError,
  SaleProductNotActiveError,
  SaleProductNotFoundError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { CreateSale, ListSalesFilters, PagedResult, Sale, SaleDetail, SaleSortField } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { Observable, delay, of, throwError } from 'rxjs';

interface MockClient {
  id: number;
  name: string;
  isActive: boolean;
  deliveryAddress: string;
}

interface MockProduct {
  id: number;
  name: string;
  isActive: boolean;
  unitPrice: number;
  vatRate: number;
  availableStock: number;
}

const MOCK_CLIENTS: MockClient[] = [
  { id: 1, name: 'Acme Corp', isActive: true, deliveryAddress: 'Calle Mayor 1, Madrid' },
  { id: 2, name: 'Beta Retail', isActive: true, deliveryAddress: 'Gran Via 55, Barcelona' },
  { id: 3, name: 'Gamma Legacy', isActive: false, deliveryAddress: 'Avenida Sur 20, Sevilla' },
];

const MOCK_PRODUCTS: MockProduct[] = [
  { id: 101, name: 'Producto A', isActive: true, unitPrice: 25, vatRate: 0.21, availableStock: 50 },
  { id: 102, name: 'Producto B', isActive: true, unitPrice: 12.5, vatRate: 0.21, availableStock: 100 },
  { id: 103, name: 'Producto C', isActive: false, unitPrice: 9.99, vatRate: 0.1, availableStock: 20 },
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
    allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
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
        id: 1,
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
    allowedTransitions: [SaleStatus.IN_PROCESS, SaleStatus.CANCELLED],
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
        id: 2,
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
  private productStock = new Map<number, number>(MOCK_PRODUCTS.map((p) => [p.id, p.availableStock]));
  private nextSaleId = INITIAL_SALES.length + 1;
  private nextLineId = INITIAL_SALES.flatMap((s) => s.lines).length + 1;

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

    if (filters.dateFrom !== undefined) {
      const dateFrom = filters.dateFrom;
      filtered = filtered.filter((sale) => sale.saleDate >= dateFrom);
    }

    if (filters.dateTo !== undefined) {
      const dateTo = filters.dateTo;
      filtered = filtered.filter((sale) => sale.saleDate <= dateTo);
    }

    const sorted = this.sortSales(filtered, filters.sortField, filters.sortOrder);
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const data = sorted.slice(start, start + pageSize).map((sale) => this.toSaleSummary(sale));

    return of({
      data,
      total,
      page,
      pageSize,
    }).pipe(delay(250));
  }

  getById(id: number): Observable<SaleDetail> {
    const sale = this.sales.find((item) => item.saleId === id);
    if (!sale) {
      return throwError(() => new SaleNotFoundError(`Sale with id ${id} was not found.`));
    }
    return of(this.cloneDetail(sale)).pipe(delay(180));
  }

  create(data: CreateSale): Observable<SaleDetail> {
    if (data.clientId <= 0) {
      return throwError(() => new SaleValidationError({ clientId: data.clientId }, 'Client is required.'));
    }

    if (data.warehouseId <= 0) {
      return throwError(() =>
        new SaleValidationError({ warehouseId: data.warehouseId }, 'Warehouse is required.')
      );
    }

    if (!data.lines.length) {
      return throwError(() => new SaleEmptyLinesError());
    }

    const client = MOCK_CLIENTS.find((item) => item.id === data.clientId);
    if (!client) {
      return throwError(() => new SaleClientNotFoundError());
    }

    if (!client.isActive) {
      return throwError(() => new SaleClientNotActiveError());
    }

    const now = new Date();
    const saleId = this.nextSaleId;

    interface LineDraft {
      productId: number;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }

    const drafts: LineDraft[] = [];
    for (const line of data.lines) {
      if (line.quantity <= 0) {
        return throwError(() => new SaleValidationError({ quantity: line.quantity }, 'Line quantity must be greater than zero.'));
      }

      const product = MOCK_PRODUCTS.find((item) => item.id === line.productId);
      if (!product) {
        return throwError(() => new SaleProductNotFoundError());
      }

      if (!product.isActive) {
        return throwError(() => new SaleProductNotActiveError());
      }

      const currentStock = this.productStock.get(product.id) ?? 0;
      if (line.quantity > currentStock) {
        return throwError(() => new SaleInsufficientStockError(
          `Insufficient stock for product ${product.id}. Requested ${line.quantity}, available ${currentStock}.`,
        ));
      }

      drafts.push({
        productId: product.id,
        quantity: line.quantity,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
      });
    }

    const lines = drafts.map((draft) => {
      const lineSubtotal = this.round2(draft.quantity * draft.unitPrice);
      const lineTax = this.round2(lineSubtotal * draft.vatRate);

      const currentStock = this.productStock.get(draft.productId) ?? 0;
      this.productStock.set(draft.productId, currentStock - draft.quantity);

      return {
        id: this.nextLineId++,
        saleId,
        productId: draft.productId,
        quantity: draft.quantity,
        unitPrice: draft.unitPrice,
        discount: 0,
        lineSubtotal,
        vatRate: draft.vatRate,
        lineTax,
      };
    });

    const subtotal = this.round2(lines.reduce((acc, line) => acc + line.lineSubtotal, 0));
    const taxes = this.round2(lines.reduce((acc, line) => acc + line.lineTax, 0));
    const total = this.round2(subtotal + taxes);

    const created: SaleDetail = {
      saleId,
      saleNumber: `SALE-${String(saleId).padStart(4, '0')}`,
      clientId: client.id,
      warehouseId: data.warehouseId,
      clientName: client.name,
      creatorName: 'Sales User',
      status: SaleStatus.PENDING,
      allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
      saleDate: now,
      deliveryAddress: client.deliveryAddress,
      createdAt: now,
      total,
      userId: 1,
      subtotal,
      taxes,
      updatedAt: now,
      lines,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: SaleStatus.PENDING,
          changedAt: now,
          changedByUserId: 1,
        },
      ],
    };

    this.nextSaleId += 1;
    this.sales = [created, ...this.sales];

    return of(this.cloneDetail(created)).pipe(delay(220));
  }

  private sortSales(
    sales: SaleDetail[],
    sortField: SaleSortField | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ): SaleDetail[] {
    if (!sortField) {
      return [...sales].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

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
        case 'created_at':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'total':
          return a.total - b.total;
        default:
          return 0;
      }
    });

    if (direction === 1) {
      return sorted;
    }

    return sorted.reverse();
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
