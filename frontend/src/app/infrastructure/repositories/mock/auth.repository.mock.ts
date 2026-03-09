import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

const MOCK_USER: AuthUser = {
  uid: 'mock-uid-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: null,
};

@Injectable()
export class MockAuthRepository implements AuthRepository {
  private currentUser: AuthUser | null = null;

  async signInWithGoogle(): Promise<AuthUser> {
    this.currentUser = MOCK_USER;
    return MOCK_USER;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  authStateChanges(): Observable<AuthUser | null> {
    return of(this.currentUser);
  }
}
