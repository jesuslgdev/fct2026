import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  GoogleAuthProvider,
  getIdToken,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';
import { AccessDeniedError } from '@domain/models/auth-errors';
import { FIREBASE_AUTH } from '@core/auth/firebase-auth.token';
import { environment } from 'environments/environment';
import { UserRole } from '@domain/enums/user-role.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';

interface LoginResponse {
  role: string;
  department_id: number | null;
  name: string;
  permissions: string[];
}

@Injectable()
export class FirebaseAuthRepository implements AuthRepository {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly http = inject(HttpClient);

  async signInWithGoogle(): Promise<Session> {
    const supplier = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, supplier);
    const firebaseToken = await getIdToken(credential.user);

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${environment.apiUrl}/api/v1/auth/login`,
          { firebase_id_token: firebaseToken },
        ),
      );
      const role: UserRole | null = Object.values(UserRole).includes(response.role as UserRole)
        ? (response.role as UserRole)
        : null;

      return {
        token: firebaseToken,
        user: {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: response.name || credential.user.displayName,
          photoURL: credential.user.photoURL,
          role,
          departmentId: response.department_id,
          permissions: response.permissions as UserPermission[],
        },
      };
    } catch (err) {
      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        await signOut(this.auth);
        throw new AccessDeniedError();
      }
      throw err;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/v1/auth/logout`, {}),
      );
    } catch {
      // logout is best-effort
    } finally {
      await signOut(this.auth);
    }
  }

  restoreSession(): Promise<Session | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        unsubscribe();
        if (!user) {
          resolve(null);
          return;
        }
        try {
          const firebaseToken = await getIdToken(user);
          const response = await firstValueFrom(
            this.http.post<LoginResponse>(
              `${environment.apiUrl}/api/v1/auth/login`,
              { firebase_id_token: firebaseToken },
            ),
          );
          const role: UserRole | null = Object.values(UserRole).includes(response.role as UserRole)
            ? (response.role as UserRole)
            : null;
          resolve({
            token: firebaseToken,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: response.name || user.displayName,
              photoURL: user.photoURL,
              role,
              departmentId: response.department_id,
              permissions: response.permissions as UserPermission[],
            },
          });
        } catch {
          resolve(null);
        }
      });
    });
  }
}

