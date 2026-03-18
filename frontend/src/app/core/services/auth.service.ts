import { Injectable, computed, signal } from '@angular/core';
import { AuthUser } from '@domain/models/auth-user.model';
import { Session } from '@domain/models/session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<Session | null>(null);

  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin = computed(() => this._session()?.user?.role === 'Administrator');
  readonly user = computed<AuthUser | null>(() => this._session()?.user ?? null);
  readonly token = computed<string | null>(() => this._session()?.token ?? null);

  setSession(session: Session | null): void {
    this._session.set(session);
  }
}
