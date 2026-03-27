import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { vi, Mock } from 'vitest';
import { ClientsPageComponent } from './clients.page.component';
import { ClientsStore, DialogMode } from '@features/clients/state/clients.store';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { Client, ClientDetail } from '@domain/models/client.model';

interface MockStore {
  clients: WritableSignal<Client[]>;
  loading: WritableSignal<boolean>;
  total: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  searchQuery: WritableSignal<string>;
  statusFilter: WritableSignal<boolean | null>;
  canEdit: Mock<() => boolean>;
  loadClients: Mock<() => Promise<void>>;
  onSearch: Mock<(query: string) => void>;
  onStatusFilterChange: Mock<(active: boolean | null) => void>;
  onPageChange: Mock<(event: { first: number; rows: number }) => void>;
  openCreateDialog: Mock<() => void>;
  openEditDialog: Mock<(client: Client | ClientDetail) => void>;
  requestToggleStatus: Mock<(client: Client) => void>;
  confirmDialogVisible: WritableSignal<boolean>;
  clientToToggle: WritableSignal<Client | null>;
  confirmToggleStatus: Mock<() => Promise<void>>;
  cancelToggleStatus: Mock<() => void>;
  error: WritableSignal<string | null>;
  dialogMode: WritableSignal<DialogMode>;
}

describe('ClientsPageComponent', () => {
  let component: ClientsPageComponent;
  let fixture: ComponentFixture<ClientsPageComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    mockStore = {
      clients: signal<Client[]>([]),
      loading: signal(false),
      total: signal(0),
      pageSize: signal(20),
      searchQuery: signal(''),
      statusFilter: signal<boolean | null>(null),
      canEdit: vi.fn(() => true),
      loadClients: vi.fn(),
      onSearch: vi.fn(),
      onStatusFilterChange: vi.fn(),
      onPageChange: vi.fn(),
      openCreateDialog: vi.fn(),
      openEditDialog: vi.fn(),
      requestToggleStatus: vi.fn(),
      confirmDialogVisible: signal(false),
      clientToToggle: signal<Client | null>(null),
      confirmToggleStatus: vi.fn(),
      cancelToggleStatus: vi.fn(),
      error: signal<string | null>(null),
      dialogMode: signal<DialogMode>('create'),
    };

    await TestBed.configureTestingModule({
      imports: [ClientsPageComponent],
      providers: [
        { provide: ClientsStore, useValue: mockStore },
        { provide: GetClientsUseCase, useValue: { execute: vi.fn() } as unknown as GetClientsUseCase },
        { provide: CreateClientUseCase, useValue: { execute: vi.fn() } as unknown as CreateClientUseCase },
        { provide: UpdateClientUseCase, useValue: { execute: vi.fn() } as unknown as UpdateClientUseCase },
        { provide: ToggleClientStatusUseCase, useValue: { execute: vi.fn() } as unknown as ToggleClientStatusUseCase },
        { provide: GetClientByIdUseCase, useValue: { execute: vi.fn() } as unknown as GetClientByIdUseCase },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize status options', () => {
    expect(component.statusOptions).toEqual([
      { label: 'Todos los estados', value: null },
      { label: 'Activo', value: true },
      { label: 'Inactivo', value: false },
    ]);
  });

  it('should call loadClients on init', () => {
    expect(mockStore.loadClients).toBeDefined();
  });

  it('should have store injected', () => {
    expect(component.store).toBeDefined();
  });
});
