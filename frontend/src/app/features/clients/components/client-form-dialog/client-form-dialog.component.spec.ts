import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';
import { vi, Mock } from 'vitest';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ClientsStore, DialogMode } from '@features/clients/state/clients.store';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { ClientDetail, CreateClientPayload, UpdateClientPayload } from '@domain/models/client.model';

interface MockStore {
  dialogVisible: WritableSignal<boolean>;
  dialogMode: WritableSignal<DialogMode>;
  dialogError: WritableSignal<string | null>;
  selectedClient: WritableSignal<ClientDetail | null>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  closeDialog: Mock<() => void>;
  saveClient: Mock<(payload: CreateClientPayload | UpdateClientPayload) => Promise<void>>;
  loadClients: Mock<() => Promise<void>>;
}

describe('ClientFormDialogComponent', () => {
  let component: ClientFormDialogComponent;
  let fixture: ComponentFixture<ClientFormDialogComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    mockStore = {
      dialogVisible: signal(false),
      dialogMode: signal<DialogMode>('create'),
      dialogError: signal<string | null>(null),
      selectedClient: signal<ClientDetail | null>(null),
      loading: signal(false),
      error: signal<string | null>(null),
      closeDialog: vi.fn(),
      saveClient: vi.fn(),
      loadClients: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientFormDialogComponent, ReactiveFormsModule, DialogComponent, InputComponent],
      providers: [
        { provide: ClientsStore, useValue: mockStore },
        { provide: GetClientsUseCase, useValue: {} as unknown as GetClientsUseCase },
        { provide: CreateClientUseCase, useValue: {} as unknown as CreateClientUseCase },
        { provide: UpdateClientUseCase, useValue: {} as unknown as UpdateClientUseCase },
        { provide: ToggleClientStatusUseCase, useValue: {} as unknown as ToggleClientStatusUseCase },
        { provide: GetClientByIdUseCase, useValue: {} as unknown as GetClientByIdUseCase },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger constructor effect
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with reset values', () => {
    // The constructor effect calls reset() because selectedClient is null
    expect(component.form.get('name')?.value).toBeNull();
    expect(component.form.get('taxId')?.value).toBeNull();
  });

  it('should patch form values when client is selected', () => {
    const client: ClientDetail = {
      clientId: 1,
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '612345678',
      email: 'test@example.com',
      isActive: true
    };

    mockStore.dialogMode.set('edit');
    mockStore.selectedClient.set(client);

    fixture.detectChanges(); // Trigger effect

    expect(component.form.value).toEqual({
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '612345678',
      email: 'test@example.com',
    });
  });

  it('should call saveClient on confirm when form is valid', () => {
    const payload = {
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '612345678',
      email: 'test@example.com',
    };

    mockStore.dialogMode.set('create');
    component.form.patchValue(payload);

    fixture.detectChanges();

    expect(component.form.valid).toBe(true);

    component.onConfirm();

    expect(mockStore.saveClient).toHaveBeenCalledWith(payload);
  });

  it('should NOT call saveClient on confirm when form is INVALID', () => {
    mockStore.dialogMode.set('create');
    component.form.patchValue({ name: 'Short' });

    fixture.detectChanges();
    expect(component.form.valid).toBe(false);

    component.onConfirm();

    expect(mockStore.saveClient).not.toHaveBeenCalled();
  });
});
