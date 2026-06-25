import { Injectable, computed, signal } from '@angular/core';
import { AuthUser } from '@domain/models/auth-user.model';
import { Session } from '@domain/models/session.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<Session | null>(null);

  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin = computed(() => this._session()?.user?.role === UserRole.Administrator);
  readonly user = computed<AuthUser | null>(() => this._session()?.user ?? null);
  readonly permissions = computed(() => this._session()?.user?.permissions ?? []);
  readonly token = computed<string | null>(() => this._session()?.token ?? null);

  setSession(session: Session | null): void {
    this._session.set(session);
  }

  hasPermission(permission: UserPermission | readonly UserPermission[]): boolean {
    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    return permissionsToCheck.some((item) => this.permissions().includes(item));
  }
}
