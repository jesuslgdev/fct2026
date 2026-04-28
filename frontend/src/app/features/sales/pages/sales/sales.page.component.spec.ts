import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { vi, type Mock } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Client } from '@domain/models/client.model';
import { Sale } from '@domain/models/sale.model';
import { SalesStore } from '@features/sales/state/sales.store';
import { BadgeComponent } from '@shared/ui';
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
  cancellingSaleId: WritableSignal<number | null>;
  deletingSaleId: WritableSignal<number | null>;
  error: WritableSignal<string | null>;
  successMessage: WritableSignal<string | null>;
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
  canChangeStatus: Mock<(saleId: number) => boolean>;
  canDeleteSale: Mock<(saleId: number) => boolean>;
  isChangingStatusSale: Mock<(saleId: number) => boolean>;
  isDeletingSale: Mock<(saleId: number) => boolean>;
  changeSaleStatus: Mock<(saleId: number, status: SaleStatus) => Promise<void>>;
  deleteSale: Mock<(saleId: number) => Promise<void>>;
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
      cancellingSaleId: signal<number | null>(null),
      deletingSaleId: signal<number | null>(null),
      error: signal<string | null>(null),
      successMessage: signal<string | null>(null),
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
      canChangeStatus: vi.fn((saleId: number) => saleId === 1),
      canDeleteSale: vi.fn((saleId: number) => saleId === 1),
      isChangingStatusSale: vi.fn(() => false),
      isDeletingSale: vi.fn(() => false),
      changeSaleStatus: vi.fn().mockResolvedValue(undefined),
      deleteSale: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SalesPageComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAdmin: signal(true),
            hasPermission: vi.fn((permission: UserPermission | UserPermission[]) => {
              if (Array.isArray(permission)) {
                return permission.includes(UserPermission.SalesDepartment);
              }

              return permission === UserPermission.SalesDepartment;
            }),
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

  it('muestra la accion de nueva venta para administradores', () => {
    const buttons = fixture.debugElement.queryAll(By.css('ui-button'));

    expect(buttons.some((button) => button.nativeElement.textContent.includes('Nueva venta'))).toBe(true);
  });

  it('navega a la pagina de alta de venta', () => {
    component.onCreateSale();

    expect(router.navigate).toHaveBeenCalledWith(['/sales/new']);
  });

  it('navega al detalle de una venta', () => {
    component.onViewSale(1);

    expect(router.navigate).toHaveBeenCalledWith(['/sales', 1]);
  });

  it('navega a la edicion de una venta', () => {
    component.onEditSale(1);

    expect(router.navigate).toHaveBeenCalledWith(['/sales', 1, 'edit']);
  });

  it('navega al detalle al hacer click en la fila', () => {
    const row = fixture.debugElement.query(By.css('tbody tr'));

    row.triggerEventHandler('click');

    expect(router.navigate).toHaveBeenCalledWith(['/sales', 1]);
  });

  it('renderiza la accion de detalle como boton icon-only', () => {
    const actionButton = fixture.debugElement.query(By.css('ui-button[ariaLabel="Ver detalle de venta"]'));

    expect(actionButton).toBeTruthy();
    expect(actionButton.attributes['icon']).toBe('pi pi-eye');
    expect(actionButton.attributes['variant']).toBe('ghost');
  });

  it('renderiza la accion de editar como boton icon-only para ventas pendientes con permisos', () => {
    const actionButton = fixture.debugElement.query(By.css('ui-button[ariaLabel="Editar venta"]'));

    expect(actionButton).toBeTruthy();
    expect(actionButton.attributes['icon']).toBe('pi pi-pencil');
    expect(actionButton.attributes['variant']).toBe('ghost');
  });

  it('renderiza la accion de cambio de estado como boton icon-only cuando aplica', () => {
    const actionButton = fixture.debugElement.query(By.css('ui-button[ariaLabel="Cambiar estado de venta"]'));

    expect(actionButton).toBeTruthy();
    expect(actionButton.attributes['icon']).toBe('pi pi-sync');
  });

  it('renderiza la accion de eliminar como boton icon-only cuando aplica', () => {
    const actionButton = fixture.debugElement.query(By.css('ui-button[ariaLabel="Eliminar venta"]'));

    expect(actionButton).toBeTruthy();
    expect(actionButton.attributes['icon']).toBe('pi pi-trash');
  });

  it('oculta la accion de editar cuando la venta no esta pendiente', () => {
    store.salesView.set([
      {
        saleId: 1,
        saleNumber: 'VEN-2026-0001',
        clientName: 'Cliente A',
        status: SaleStatus.APPROVED,
        deliveryAddress: 'Calle Mayor 1, Madrid',
        createdAt: SALE_A.createdAt,
        total: 100,
      },
    ]);
    fixture.detectChanges();

    const actionButton = fixture.debugElement.query(By.css('ui-button[ariaLabel="Editar venta"]'));

    expect(actionButton).toBeNull();
  });

  it('abre el dialogo de cambio de estado y delega en el store', () => {
    component.onRequestChangeStatus(1);

    expect(component.changeStatusDialogVisible()).toBe(true);
    expect(component.selectedSaleId()).toBe(1);
    expect(component.getCurrentSaleStatusLabel()).toBe('Pendiente');

    component.onTransitionSelectionChange(SaleStatus.CANCELLED);
    expect(component.getSelectedTransitionImpact()).toContain('quedara cancelada');

    component.onConfirmChangeStatus();

    expect(component.changeStatusDialogVisible()).toBe(false);
    expect(store.changeSaleStatus).toHaveBeenCalledWith(1, SaleStatus.CANCELLED);
  });

  it('abre el dialogo de eliminacion y delega en el store', () => {
    component.onRequestDeleteSale(1);

    expect(component.deleteDialogVisible()).toBe(true);
    expect(component.selectedSaleId()).toBe(1);

    component.onConfirmDeleteSale();

    expect(component.deleteDialogVisible()).toBe(false);
    expect(store.deleteSale).toHaveBeenCalledWith(1);
  });

  it('builds the available transitions from the selected sale', () => {
    expect(component.getAvailableTransitions(1)).toEqual([
      { label: 'Aprobar', value: SaleStatus.APPROVED },
      { label: 'Cancelar', value: SaleStatus.CANCELLED },
    ]);
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

  it('asigna la variante e icono correctos al badge de estado', () => {
    expect(component.getStatusBadgeVariant(SaleStatus.PENDING)).toBe('warning');
    expect(component.getStatusBadgeIcon(SaleStatus.PENDING)).toBe('pi pi-clock');
    expect(component.getStatusBadgeVariant(SaleStatus.APPROVED)).toBe('info');
    expect(component.getStatusBadgeVariant(SaleStatus.IN_PROCESS)).toBe('contrast');
    expect(component.getStatusBadgeVariant(SaleStatus.SHIPPED)).toBe('secondary');
    expect(component.getStatusBadgeVariant(SaleStatus.DELIVERED)).toBe('success');
    expect(component.getStatusBadgeVariant(SaleStatus.CANCELLED)).toBe('danger');
    expect(component.getStatusBadgeIcon(SaleStatus.DELIVERED)).toBe('pi pi-check-circle');
  });

  it('renders the sales row with the fields required by the listing', () => {
    const cells = fixture.debugElement.queryAll(By.css('tbody tr td'));
    const badge = fixture.debugElement.query(By.directive(BadgeComponent));

    expect(cells[0].nativeElement.textContent.trim()).toBe('VEN-2026-0001');
    expect(cells[1].nativeElement.textContent.trim()).toBe('Cliente A');
    expect(cells[2].nativeElement.textContent.trim()).toContain('Pendiente');
    expect(badge).toBeTruthy();
    expect((badge.componentInstance as BadgeComponent).icon()).toBe('pi pi-clock');
    expect((badge.componentInstance as BadgeComponent).variant()).toBe('warning');
    expect(cells[3].nativeElement.textContent.trim()).toBe('Calle Mayor 1, Madrid');
    expect(cells[5].nativeElement.textContent.trim()).toContain('€');
  });
});
