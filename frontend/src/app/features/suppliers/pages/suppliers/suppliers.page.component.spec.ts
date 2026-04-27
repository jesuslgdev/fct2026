import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SuppliersPageComponent } from './suppliers.page.component';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { Supplier } from '@domain/models/supplier.model';
import { SupplierRepository } from '@domain/repositories/supplier.repository';

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
        { provide: SupplierRepository, useValue: {} },
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
      { label: 'Activo', value: SupplierStatus.ACTIVE },
      { label: 'Inactivo', value: SupplierStatus.INACTIVE },
    ]);
  });

  it('should track suppliers by id', () => {
    const mockProvider: Supplier = {
      id: '1',
      name: 'Test Supplier',
      taxId: '123456789',
      email: 'supplier@test.com',
      phone: '+1234567890',
      address: 'Test Address',
      isActive: true,
      status: SupplierStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = component.trackById(0, mockProvider);
    expect(result).toBe(1);
  });

  it('should get correct status label for active supplier', () => {
    const result = component.getStatusLabel(SupplierStatus.ACTIVE);
    expect(result).toBe('Activo');
  });

  it('should get correct status label for inactive supplier', () => {
    const result = component.getStatusLabel(SupplierStatus.INACTIVE);
    expect(result).toBe('Inactivo');
  });

  it('should return status as fallback for unknown status', () => {
    const result = component.getStatusLabel('unknown' as SupplierStatus);
    expect(result).toBe('unknown');
  });

  it('should return success variant for active status', () => {
    const result = component.getStatusBadgeVariant(SupplierStatus.ACTIVE);
    expect(result).toBe('success');
  });

  it('should return danger variant for inactive status', () => {
    const result = component.getStatusBadgeVariant(SupplierStatus.INACTIVE);
    expect(result).toBe('danger');
  });

  it('should reload first page when import completes', () => {
    const loadSuppliersSpy = vi
      .spyOn(component.store, 'loadSuppliers')
      .mockResolvedValue(undefined);
    component.store.pageSize.set(20);

    component.onImportCompleted();

    expect(loadSuppliersSpy).toHaveBeenCalledWith({
      page: 1,
      rows: 20,
      first: 0,
    });
  });
});

