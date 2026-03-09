import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');

@Injectable()
export class FirebaseAuthRepository implements AuthRepository {
  private auth = inject(FIREBASE_AUTH);

  async signInWithGoogle(): Promise<AuthUser> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const { uid, email, displayName, photoURL } = credential.user;
    return { uid, email, displayName, photoURL };
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const { uid, email, displayName, photoURL } = user;
    return { uid, email, displayName, photoURL };
  }

  authStateChanges(): Observable<AuthUser | null> {
    return new Observable((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (user) {
          const { uid, email, displayName, photoURL } = user;
          observer.next({ uid, email, displayName, photoURL });
        } else {
          observer.next(null);
        }
      });
      return () => unsubscribe();
    });
  }
}
