import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { adminGuard, isAdminRole } from '@core/guards/admin.guard';

class MockAuthService {
  private _user = signal<{ role?: string | null } | null>(null);
  readonly user = this._user.asReadonly();
  setUser(value: { role?: string | null } | null) {
    this._user.set(value);
  }
}

describe('adminGuard', () => {
  let mockAuth: MockAuthService;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuth = new MockAuthService();
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('/dashboard') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('permite si el rol es admin', async () => {
    mockAuth.setUser({ role: 'admin' });
    const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('permite si el rol es Administrator', async () => {
    mockAuth.setUser({ role: 'Administrator' });
    const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirige cuando no es admin', async () => {
    mockAuth.setUser({ role: 'user' });
    const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard');
  });
});

// helper tests

describe('isAdminRole helper', () => {
  it('devuelve true para distintos admin', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('Administrator')).toBe(true);
    expect(isAdminRole('AdminXYZ')).toBe(true);
  });
  it('devuelve false en otros casos', () => {
    expect(isAdminRole('user')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

