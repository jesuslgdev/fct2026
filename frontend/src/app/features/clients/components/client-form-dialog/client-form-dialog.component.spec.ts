import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ClientsStore } from '@features/clients/state/clients.store';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { vi } from 'vitest';

interface MockStore {
  dialogVisible: ReturnType<typeof vi.fn>;
  dialogMode: ReturnType<typeof vi.fn>;
  selectedClient: ReturnType<typeof vi.fn>;
  isViewMode: ReturnType<typeof vi.fn>;
  getDialogTitle: ReturnType<typeof vi.fn>;
  closeDialog: ReturnType<typeof vi.fn>;
  saveClient: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  loading: ReturnType<typeof vi.fn>;
}

describe('ClientFormDialogComponent', () => {
  let component: ClientFormDialogComponent;
  let fixture: ComponentFixture<ClientFormDialogComponent>;
  let mockStore: MockStore;
  let mockGetClientsUseCase: GetClientsUseCase;
  let mockCreateClientUseCase: CreateClientUseCase;
  let mockUpdateClientUseCase: UpdateClientUseCase;
  let mockToggleClientStatusUseCase: ToggleClientStatusUseCase;
  let mockGetClientByIdUseCase: GetClientByIdUseCase;

  beforeEach(async () => {
    mockGetClientsUseCase = {
      execute: vi.fn(),
    } as any;

    mockCreateClientUseCase = {
      execute: vi.fn(),
    } as any;

    mockUpdateClientUseCase = {
      execute: vi.fn(),
    } as any;

    mockToggleClientStatusUseCase = {
      execute: vi.fn(),
    } as any;

    mockGetClientByIdUseCase = {
      execute: vi.fn(),
    } as any;

    mockStore = {
      dialogVisible: vi.fn(),
      dialogMode: vi.fn(),
      selectedClient: vi.fn(),
      isViewMode: vi.fn(),
      getDialogTitle: vi.fn(),
      closeDialog: vi.fn(),
      saveClient: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientFormDialogComponent, ReactiveFormsModule, DialogComponent, InputComponent],
      providers: [
        { provide: ClientsStore, useValue: mockStore },
        { provide: GetClientsUseCase, useValue: mockGetClientsUseCase },
        { provide: CreateClientUseCase, useValue: mockCreateClientUseCase },
        { provide: UpdateClientUseCase, useValue: mockUpdateClientUseCase },
        { provide: ToggleClientStatusUseCase, useValue: mockToggleClientStatusUseCase },
        { provide: GetClientByIdUseCase, useValue: mockGetClientByIdUseCase },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have store injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.value).toEqual({
      name: '',
      taxId: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
    });
  });

  it('should patch form values when client is selected', () => {
    const client = {
      clientId: 1,
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    };

    mockStore.selectedClient.mockReturnValue(client);
    mockStore.dialogMode.mockReturnValue('edit');
    fixture.detectChanges(); // Trigger effect

    expect(component.form.value).toEqual({
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    });
  });

  it('should reset form when dialog mode is create', () => {
    mockStore.selectedClient.mockReturnValue(null);
    mockStore.dialogMode.mockReturnValue('create');
    fixture.detectChanges(); // Trigger effect

    expect(component.form.value).toEqual({
      name: '',
      taxId: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
    });
  });

  it('should call saveClient on confirm', () => {
    const payload = {
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    };

    component.form.patchValue(payload);
    component.form.markAllAsTouched();

    component.onConfirm();

    expect(mockStore.saveClient).toHaveBeenCalledWith(payload);
    expect(mockStore.closeDialog).toHaveBeenCalled();
  });

  it('should close dialog on cancel', () => {
    component.onCancel();

    expect(mockStore.closeDialog).toHaveBeenCalled();
  });
});
