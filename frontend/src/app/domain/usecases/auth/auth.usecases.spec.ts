import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';
import { SignInWithGoogleUseCase } from '@domain/usecases/auth/sign-in-with-google.usecase';
import { SignOutUseCase } from '@domain/usecases/auth/sign-out.usecase';

const MOCK_SESSION: Session = {
  token: 'test-jwt-token',
  user: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  },
};

class MockAuthRepository implements AuthRepository {
  signInWithGoogle = vi.fn().mockResolvedValue(MOCK_SESSION);
  signOut = vi.fn().mockResolvedValue(undefined);
  restoreSession = vi.fn().mockResolvedValue(null);
}

describe('Auth Use Cases', () => {
  let mockRepo: MockAuthRepository;

  beforeEach(() => {
    mockRepo = new MockAuthRepository();
    TestBed.configureTestingModule({
      providers: [
        SignInWithGoogleUseCase,
        SignOutUseCase,
        { provide: AuthRepository, useValue: mockRepo },
      ],
    });
  });

  describe('SignInWithGoogleUseCase', () => {
    it('calls signInWithGoogle and returns the session', async () => {
      const useCase = TestBed.inject(SignInWithGoogleUseCase);
      const result = await useCase.execute();
      expect(mockRepo.signInWithGoogle).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SESSION);
    });
  });

  describe('SignOutUseCase', () => {
    it('calls signOut on the repository', async () => {
      const useCase = TestBed.inject(SignOutUseCase);
      await useCase.execute();
      expect(mockRepo.signOut).toHaveBeenCalledOnce();
    });
  });
});
