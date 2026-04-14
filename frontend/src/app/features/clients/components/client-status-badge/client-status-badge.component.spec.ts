import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientStatusBadgeComponent } from './client-status-badge.component';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

describe('ClientStatusBadgeComponent', () => {
  let component: ClientStatusBadgeComponent;
  let fixture: ComponentFixture<ClientStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientStatusBadgeComponent, BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Activo" for active clients', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    expect(component.label()).toBe('Activo');
    expect(component.variant()).toBe('success');
  });

  it('should show "Inactivo" for inactive clients', () => {
    fixture.componentRef.setInput('isActive', false);
    fixture.detectChanges();

    expect(component.label()).toBe('Inactivo');
    expect(component.variant()).toBe('danger');
  });
});
