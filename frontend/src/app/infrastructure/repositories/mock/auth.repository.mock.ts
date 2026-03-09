import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

// pretend this is the photo URL from the Google account
const MOCK_USER: AuthUser = {
  uid: 'mock-uid-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: 'https://gravatar.com/avatar/dcf2ac25f9a965f613793050b981afa1?s=400&d=wavatar&r=x',
};

@Injectable()
export class MockAuthRepository implements AuthRepository {
  private currentUser: AuthUser | null = null;
  private authState$ = new BehaviorSubject<AuthUser | null>(null);

  async signInWithGoogle(): Promise<AuthUser> {
    this.currentUser = MOCK_USER;
    this.authState$.next(this.currentUser);
    return MOCK_USER;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.authState$.next(null);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  authStateChanges(): Observable<AuthUser | null> {
    return this.authState$.asObservable();
  }
}
