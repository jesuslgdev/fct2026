import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { authGuard } from '@core/guards/auth.guard';

class MockAuthService {
  private _logged = signal(false);
  private _admin = signal(false);
  readonly isLoggedIn = this._logged.asReadonly();
  readonly isAdmin = this._admin.asReadonly();
  setLogged(value: boolean) {
    this._logged.set(value);
  }
  setAdmin(value: boolean) {
    this._admin.set(value);
  }
}

describe('authGuard', () => {
  let mockAuth: MockAuthService;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuth = new MockAuthService();
    mockRouter = {
      createUrlTree: vi.fn().mockImplementation((commands: string[]) => commands[0]),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('returns true when a user is authenticated', async () => {
    mockAuth.setLogged(true);
    mockAuth.setAdmin(false);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects authenticated admin user from / to /departments', async () => {
    mockAuth.setLogged(true);
    mockAuth.setAdmin(true);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/' } as never),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/departments']);
    expect(result).toBe('/departments');
  });

  it('redirects authenticated non-admin user from / to /legal/terms', async () => {
    mockAuth.setLogged(true);
    mockAuth.setAdmin(false);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/' } as never),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/legal/terms']);
    expect(result).toBe('/legal/terms');
  });

  it('redirects to /auth/login when no user is authenticated', async () => {
    mockAuth.setLogged(false);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: undefined },
    });
    expect(result).toBe('/auth/login');
  });
});
