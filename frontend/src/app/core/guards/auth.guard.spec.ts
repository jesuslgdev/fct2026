import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';
import { authGuard } from '@core/guards/auth.guard';

const MOCK_USER: AuthUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

class MockAuthRepository implements AuthRepository {
  signInWithGoogle = vi.fn().mockResolvedValue(MOCK_USER);
  signOut = vi.fn().mockResolvedValue(undefined);
  getCurrentUser = vi.fn().mockResolvedValue(MOCK_USER);
  authStateChanges = vi.fn((): Observable<AuthUser | null> => of(MOCK_USER));
}

describe('authGuard', () => {
  let mockRepo: MockAuthRepository;
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepo = new MockAuthRepository();
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('/auth/login') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRepository, useValue: mockRepo },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('returns true when a user is authenticated', async () => {
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to /auth/login when no user is authenticated', async () => {
    mockRepo.getCurrentUser.mockResolvedValue(null);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login');
  });
});
