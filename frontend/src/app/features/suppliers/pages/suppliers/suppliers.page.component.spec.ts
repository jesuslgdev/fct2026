import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SuppliersPageComponent } from './suppliers.page.component';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { Provider } from '@domain/models/provider.model';
import { ProviderRepository } from '@domain/repositories/provider.repository';

describe('SuppliersPageComponent', () => {
  let component: SuppliersPageComponent;
  let fixture: ComponentFixture<SuppliersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        SuppliersPageComponent,
      ],
      providers: [
        { provide: ProviderRepository, useValue: {} },
      ],
    })
    .overrideComponent(SuppliersPageComponent, {
      remove: { imports: [SuppliersPageComponent] },
      add: { imports: [FormsModule] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have status options with all states', () => {
    expect(component.statusOptions).toEqual([
      { label: 'Todos los estados', value: null },
      { label: 'Activo', value: ProviderStatus.ACTIVE },
      { label: 'Inactivo', value: ProviderStatus.INACTIVE },
    ]);
  });

  it('should track providers by id', () => {
    const mockProvider: Provider = {
      id: '1',
      name: 'Test Provider',
      taxId: '123456789',
      email: 'provider@test.com',
      phone: '+1234567890',
      address: 'Test Address',
      isActive: true,
      status: ProviderStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = component.trackById(0, mockProvider);
    expect(result).toBe(1);
  });

  it('should get correct status label for active provider', () => {
    const result = component.getStatusLabel(ProviderStatus.ACTIVE);
    expect(result).toBe('Activo');
  });

  it('should get correct status label for inactive provider', () => {
    const result = component.getStatusLabel(ProviderStatus.INACTIVE);
    expect(result).toBe('Inactivo');
  });

  it('should return status as fallback for unknown status', () => {
    const result = component.getStatusLabel('unknown' as ProviderStatus);
    expect(result).toBe('unknown');
  });

  it('should return success variant for active status', () => {
    const result = component.getStatusBadgeVariant(ProviderStatus.ACTIVE);
    expect(result).toBe('success');
  });

  it('should return danger variant for inactive status', () => {
    const result = component.getStatusBadgeVariant(ProviderStatus.INACTIVE);
    expect(result).toBe('danger');
  });
});
