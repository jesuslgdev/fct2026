import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { Supplier } from '@domain/models/supplier.model';
import { SupplierRepository } from '@domain/repositories/supplier.repository';
import { SuppliersPageComponent } from './suppliers.page.component';

describe('SuppliersPageComponent', () => {
  let component: SuppliersPageComponent;
  let fixture: ComponentFixture<SuppliersPageComponent>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    navigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [FormsModule, SuppliersPageComponent],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: SupplierRepository, useValue: {} },
      ],
    })
      .overrideComponent(SuppliersPageComponent, {
        remove: { imports: [SuppliersPageComponent] },
        add: { imports: [FormsModule] },
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
    const mockSupplier: Supplier = {
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

    expect(component.trackById(0, mockSupplier)).toBe(1);
  });

  it('should navigate to supplier detail page', () => {
    component.openSupplierDetail({ id: '7' } as Supplier);

    expect(navigate).toHaveBeenCalledWith(['/suppliers', '7']);
  });

  it('should get correct status label for active supplier', () => {
    expect(component.getStatusLabel(SupplierStatus.ACTIVE)).toBe('Activo');
  });

  it('should get correct status label for inactive supplier', () => {
    expect(component.getStatusLabel(SupplierStatus.INACTIVE)).toBe('Inactivo');
  });

  it('should return status as fallback for unknown status', () => {
    expect(component.getStatusLabel('unknown' as SupplierStatus)).toBe('unknown');
  });

  it('should return success variant for active status', () => {
    expect(component.getStatusBadgeVariant(SupplierStatus.ACTIVE)).toBe('success');
  });

  it('should return danger variant for inactive status', () => {
    expect(component.getStatusBadgeVariant(SupplierStatus.INACTIVE)).toBe('danger');
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
