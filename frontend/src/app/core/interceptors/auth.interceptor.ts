import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { FIREBASE_AUTH } from '@core/auth/firebase-auth.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const firebaseAuth = inject(FIREBASE_AUTH, { optional: true });

  // When Firebase is available, always get a fresh (auto-refreshed) token
  if (firebaseAuth?.currentUser) {
    return from(firebaseAuth.currentUser.getIdToken()).pipe(
      switchMap(token =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
      ),
    );
  }

  // Fallback: use stored token (mock mode)
  const token = inject(AuthService).token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
