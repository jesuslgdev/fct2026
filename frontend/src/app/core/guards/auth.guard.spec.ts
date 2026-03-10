import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { authGuard } from '@core/guards/auth.guard';

class MockAuthService {
  private _logged = signal(false);
  readonly isLoggedIn = this._logged.asReadonly();
  setLogged(value: boolean) {
    this._logged.set(value);
  }
}

describe('authGuard', () => {
  let mockAuth: MockAuthService;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuth = new MockAuthService();
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('/auth/login') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('returns true when a user is authenticated', async () => {
    mockAuth.setLogged(true);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to /auth/login when no user is authenticated', async () => {
    mockAuth.setLogged(false);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login');
  });
});
