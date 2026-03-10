import { Injectable } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';

const MOCK_SESSION: Session = {
  token: 'mock-jwt-token-dev',
  user: {
    uid: 'mock-uid-123',
    email: 'dev@example.com',
    displayName: 'Dev User',
    photoURL: 'https://gravatar.com/avatar/dcf2ac25f9a965f613793050b981afa1?s=400&d=wavatar&r=x',
    role: 'Administrator',
  },
};

@Injectable()
export class MockAuthRepository implements AuthRepository {
  async signInWithGoogle(): Promise<Session> {
    return MOCK_SESSION;
  }

  async signOut(): Promise<void> {
    // no-op: mock implementation
    return Promise.resolve();
  }
}

