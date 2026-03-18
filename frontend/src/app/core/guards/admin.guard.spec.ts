import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { adminGuard } from './admin.guard';

class MockAuthService {
  private _isAdmin = signal(false);
  readonly isAdmin = this._isAdmin.asReadonly();
  setIsAdmin(value: boolean) { this._isAdmin.set(value); }
}

describe('adminGuard', () => {
  let mockAuth: MockAuthService;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuth = new MockAuthService();
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('/legal/terms') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user is admin', async () => {
    mockAuth.setIsAdmin(true);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never)
    );

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to terms when user is not admin', async () => {
    mockAuth.setIsAdmin(false);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never)
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/legal/terms']);
    expect(result).toBe('/legal/terms');
  });
});
