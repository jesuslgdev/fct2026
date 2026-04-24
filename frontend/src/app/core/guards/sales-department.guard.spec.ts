import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { salesDepartmentGuard } from './sales-department.guard';

class MockAuthService {
  private permissions: UserPermission[] = [];

  setPermissions(value: UserPermission[]): void {
    this.permissions = value;
  }

  hasPermission(permission: UserPermission | UserPermission[]): boolean {
    if (Array.isArray(permission)) {
      return permission.some((item) => this.permissions.includes(item));
    }

    return this.permissions.includes(permission);
  }
}

describe('salesDepartmentGuard', () => {
  let mockAuth: MockAuthService;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuth = new MockAuthService();
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('/unauthorized') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user belongs to sales department', async () => {
    mockAuth.setPermissions([UserPermission.SalesDepartment]);

    const result = await TestBed.runInInjectionContext(() =>
      salesDepartmentGuard({} as never, {} as never)
    );

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should allow access when user is sales manager', async () => {
    mockAuth.setPermissions([UserPermission.SalesManager]);

    const result = await TestBed.runInInjectionContext(() =>
      salesDepartmentGuard({} as never, {} as never)
    );

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should allow access when user is admin', async () => {
    mockAuth.setPermissions([UserPermission.Admin]);

    const result = await TestBed.runInInjectionContext(() =>
      salesDepartmentGuard({} as never, {} as never)
    );

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to unauthorized when user lacks sales department permission', async () => {
    mockAuth.setPermissions([]);

    const result = await TestBed.runInInjectionContext(() =>
      salesDepartmentGuard({} as never, {} as never)
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(result).toBe('/unauthorized');
  });
});
