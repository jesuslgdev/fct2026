import { Session } from '@domain/models/session.model';

export abstract class AuthRepository {
  abstract signInWithGoogle(): Promise<Session>;
  abstract signOut(): Promise<void>;
  abstract restoreSession(): Promise<Session | null>;
}
