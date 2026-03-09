import { Observable } from 'rxjs';
import { AuthUser } from '@domain/models/auth-user.model';

export abstract class AuthRepository {
  abstract signInWithGoogle(): Promise<AuthUser>;
  abstract signOut(): Promise<void>;
  abstract getCurrentUser(): Promise<AuthUser | null>;
  abstract authStateChanges(): Observable<AuthUser | null>;
}
