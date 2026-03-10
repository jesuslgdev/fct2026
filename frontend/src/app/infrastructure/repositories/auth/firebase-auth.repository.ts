import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Auth,
  GoogleAuthProvider,
  getIdToken,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';
import { AccessDeniedError } from '@domain/models/auth-errors';

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');

interface VerifyResponse {
  token: string;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
}

@Injectable()
export class FirebaseAuthRepository implements AuthRepository {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly http = inject(HttpClient);

  async signInWithGoogle(): Promise<Session> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const idToken = await getIdToken(credential.user);

    try {
      const response = await firstValueFrom(
        this.http.post<VerifyResponse>('/api/auth/verify', { idToken }),
      );
      return {
        token: response.token,
        user: {
          uid: response.user.uid,
          email: response.user.email,
          displayName: response.user.displayName,
          photoURL: response.user.photoURL,
        },
      };
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        await signOut(this.auth);
        throw new AccessDeniedError();
      }
      throw err;
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}
