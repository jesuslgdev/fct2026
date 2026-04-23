import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { vi, type Mock } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Client } from '@domain/models/client.model';
import { Sale } from '@domain/models/sale.model';
import { SalesStore } from '@features/sales/state/sales.store';
import { SalesPageComponent } from './sales.page.component';

interface MockSalesStore {
  sales: WritableSignal<Sale[]>;
  salesView: WritableSignal<{
    saleId: number;
    saleNumber: string;
    clientName: string;
    status: SaleStatus;
    deliveryAddress: string;
    createdAt: Date;
    total: number;
  }[]>;
  clients: WritableSignal<Client[]>;
  total: WritableSignal<number>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  clientsLoading: WritableSignal<boolean>;
  clientsError: WritableSignal<string | null>;
  statusFilter: WritableSignal<SaleStatus | null>;
  clientFilter: WritableSignal<number | null>;
  dateFromFilter: WritableSignal<Date | null>;
  dateToFilter: WritableSignal<Date | null>;
  emptyMessage: WritableSignal<string | null>;
  loadSales: Mock<() => Promise<void>>;
  loadClientsForFilter: Mock<() => Promise<void>>;
  onStatusFilterChange: Mock<(status: SaleStatus | null) => void>;
  onClientFilterChange: Mock<(clientId: number | null) => void>;
  onDateFromFilterChange: Mock<(dateFrom: Date | null) => void>;
  onDateToFilterChange: Mock<(dateTo: Date | null) => void>;
  clearFilters: Mock<() => void>;
  onPageChange: Mock<(event: { first: number; rows: number }) => void>;
}

const CLIENT_A: Client = {
  clientId: 1,
  name: 'Cliente A',
  taxId: '12345678A',
  city: 'Madrid',
  isActive: true,
};

const SALE_A: Sale = {
  saleId: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 1,
  clientName: 'Cliente A',
  creatorName: 'Vendedor A',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
  deliveryAddress: 'Calle Mayor 1, Madrid',
  saleDate: new Date('2026-04-01T10:00:00.000Z'),
  createdAt: new Date('2026-04-01T10:01:00.000Z'),
  total: 100,
};

describe('SalesPageComponent', () => {
  let fixture: ComponentFixture<SalesPageComponent>;
  let component: SalesPageComponent;
  let store: MockSalesStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    store = {
      sales: signal<Sale[]>([SALE_A]),
      salesView: signal([
        {
          saleId: 1,
          saleNumber: 'VEN-2026-0001',
          clientName: 'Cliente A',
          status: SaleStatus.PENDING,
          deliveryAddress: 'Calle Mayor 1, Madrid',
          createdAt: SALE_A.createdAt,
          total: 100,
        },
      ]),
      clients: signal<Client[]>([CLIENT_A]),
      total: signal(1),
      page: signal(1),
      pageSize: signal(20),
      loading: signal(false),
      error: signal<string | null>(null),
      clientsLoading: signal(false),
      clientsError: signal<string | null>(null),
      statusFilter: signal<SaleStatus | null>(null),
      clientFilter: signal<number | null>(null),
      dateFromFilter: signal<Date | null>(null),
      dateToFilter: signal<Date | null>(null),
      emptyMessage: signal<string | null>(null),
      loadSales: vi.fn().mockResolvedValue(undefined),
      loadClientsForFilter: vi.fn().mockResolvedValue(undefined),
      onStatusFilterChange: vi.fn(),
      onClientFilterChange: vi.fn(),
      onDateFromFilterChange: vi.fn(),
      onDateToFilterChange: vi.fn(),
      clearFilters: vi.fn(),
      onPageChange: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SalesPageComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAdmin: signal(true),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    })
      .overrideComponent(SalesPageComponent, {
        set: {
          providers: [{ provide: SalesStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SalesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads sales and clients for filter on init', () => {
    expect(store.loadSales).toHaveBeenCalledOnce();
    expect(store.loadClientsForFilter).toHaveBeenCalledOnce();
  });

  it('defines status options for the sales filters', () => {
    expect(component.statusOptions).toEqual([
      { label: 'Todos los estados', value: null },
      { label: 'Pendiente', value: SaleStatus.PENDING },
      { label: 'Aprobada', value: SaleStatus.APPROVED },
      { label: 'En proceso', value: SaleStatus.IN_PROCESS },
      { label: 'Enviada', value: SaleStatus.SHIPPED },
      { label: 'Entregada', value: SaleStatus.DELIVERED },
      { label: 'Cancelada', value: SaleStatus.CANCELLED },
    ]);
  });

  it('forwards status filter changes to the store', () => {
    component.onStatusChange(SaleStatus.APPROVED);

    expect(store.onStatusFilterChange).toHaveBeenCalledWith(SaleStatus.APPROVED);
  });

  it('forwards client filter changes to the store', () => {
    component.onClientChange(1);

    expect(store.onClientFilterChange).toHaveBeenCalledWith(1);
  });

  it('forwards date from changes to the store', () => {
    const dateFrom = new Date('2026-04-01T00:00:00.000Z');

    component.onDateFromChange(dateFrom);

    expect(store.onDateFromFilterChange).toHaveBeenCalledWith(dateFrom);
  });

  it('forwards date to changes to the store', () => {
    const dateTo = new Date('2026-04-30T23:59:59.000Z');

    component.onDateToChange(dateTo);

    expect(store.onDateToFilterChange).toHaveBeenCalledWith(dateTo);
  });

  it('clears filters through the store', () => {
    component.onClearFilters();

    expect(store.clearFilters).toHaveBeenCalledOnce();
  });

  it('forwards page changes with safe defaults', () => {
    component.onPageChange({ first: 20, rows: 20 });

    expect(store.onPageChange).toHaveBeenCalledWith({ first: 20, rows: 20 });
  });

  it('uses the store page size when page event rows are missing', () => {
    component.onPageChange({ first: 0 } as never);

    expect(store.onPageChange).toHaveBeenCalledWith({ first: 0, rows: 20 });
  });

  it('renders the sales title', () => {
    const title = fixture.debugElement.query(By.css('h1'));

    expect(title.nativeElement.textContent.trim()).toBe('Ventas');
  });

  it('muestra la acción de nueva venta para administradores', () => {
    const buttons = fixture.debugElement.queryAll(By.css('ui-button'));

    expect(buttons.some((button) => button.nativeElement.textContent.includes('Nueva venta'))).toBe(true);
  });

  it('navega a la página de alta de venta', () => {
    component.onCreateSale();

    expect(router.navigate).toHaveBeenCalledWith(['/sales/new']);
  });

  it('renders the filtered empty message when provided by the store', () => {
    store.salesView.set([]);
    store.emptyMessage.set('No se encontraron ventas con los filtros aplicados');
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));

    expect(emptyState.nativeElement.textContent).toContain(
      'No se encontraron ventas con los filtros aplicados',
    );
  });

  it('renders a fallback empty message when the store has no filtered message', () => {
    store.salesView.set([]);
    store.emptyMessage.set(null);
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));

    expect(emptyState.nativeElement.textContent).toContain('No hay ventas registradas.');
  });

  it('traduce el estado para la interfaz', () => {
    expect(component.getStatusLabel(SaleStatus.PENDING)).toBe('Pendiente');
    expect(component.getStatusLabel(SaleStatus.APPROVED)).toBe('Aprobada');
  });

  it('renders the sales row with the fields required by the listing', () => {
    const cells = fixture.debugElement.queryAll(By.css('tbody tr td'));

    expect(cells[0].nativeElement.textContent.trim()).toBe('VEN-2026-0001');
    expect(cells[1].nativeElement.textContent.trim()).toBe('Cliente A');
    expect(cells[2].nativeElement.textContent.trim()).toBe('Pendiente');
    expect(cells[3].nativeElement.textContent.trim()).toBe('Calle Mayor 1, Madrid');
    expect(cells[5].nativeElement.textContent.trim()).toContain('€');
  });
});
