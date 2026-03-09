import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore implements OnDestroy {
  private authRepository = inject(AuthRepository);

  private _user = signal<AuthUser | null>(null);
  private _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  private subscription: Subscription;

  constructor() {
    this.subscription = this.authRepository
      .authStateChanges()
      .subscribe((user) => {
        this._user.set(user);
        this._loading.set(false);
      });
  }

  setUser(user: AuthUser | null): void {
    this._user.set(user);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
