import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';
import { SignInWithGoogleUseCase } from '@domain/usecases/auth/sign-in-with-google.usecase';
import { SignOutUseCase } from '@domain/usecases/auth/sign-out.usecase';
import { GetCurrentUserUseCase } from '@domain/usecases/auth/get-current-user.usecase';

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

describe('Auth Use Cases', () => {
  let mockRepo: MockAuthRepository;

  beforeEach(() => {
    mockRepo = new MockAuthRepository();
    TestBed.configureTestingModule({
      providers: [
        SignInWithGoogleUseCase,
        SignOutUseCase,
        GetCurrentUserUseCase,
        { provide: AuthRepository, useValue: mockRepo },
      ],
    });
  });

  describe('SignInWithGoogleUseCase', () => {
    it('calls signInWithGoogle on the repository', async () => {
      const useCase = TestBed.inject(SignInWithGoogleUseCase);
      const result = await useCase.execute();
      expect(mockRepo.signInWithGoogle).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_USER);
    });
  });

  describe('SignOutUseCase', () => {
    it('calls signOut on the repository', async () => {
      const useCase = TestBed.inject(SignOutUseCase);
      await useCase.execute();
      expect(mockRepo.signOut).toHaveBeenCalledOnce();
    });
  });

  describe('GetCurrentUserUseCase', () => {
    it('returns the current user from the repository', async () => {
      const useCase = TestBed.inject(GetCurrentUserUseCase);
      const result = await useCase.execute();
      expect(result).toEqual(MOCK_USER);
    });

    it('returns null when no user is authenticated', async () => {
      mockRepo.getCurrentUser.mockResolvedValue(null);
      const useCase = TestBed.inject(GetCurrentUserUseCase);
      const result = await useCase.execute();
      expect(result).toBeNull();
    });
  });
});
