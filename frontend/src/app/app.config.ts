// Application configuration for Angular app
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { routes } from './app.routes';
import { ErpPreset } from '@theme/erp.preset';
import { FIREBASE_AUTH } from '@core/auth/firebase-auth.token';
import { FirebaseAuthRepository } from '@infrastructure/repositories/auth/firebase-auth.repository';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
<<<<<<< HEAD
import { environment } from 'environments/environment';
import { MockUserRepository } from '@infrastructure/repositories/mock/user.repository.mock';
import { UserRepository } from '@domain/repositories/user.repository';

const firebaseApp = initializeApp(environment.firebase);
const firebaseAuth = getAuth(firebaseApp);
=======
import { MockUserRepository } from '@infrastructure/repositories/mock/user.repository.mock';
import { UserRepository } from '@domain/repositories/user.repository';
// TODO: switch to FirebaseAuthRepository when backend is ready
>>>>>>> 8cb614a7ba0b2f4debaf6013311a20ae47bd4897

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ])
    ),
<<<<<<< HEAD
    { provide: FIREBASE_AUTH, useValue: firebaseAuth },
    { provide: AuthRepository, useClass: FirebaseAuthRepository },
    { provide: UserRepository, useClass: MockUserRepository },
    // TODO(api_connect): switch to HttpUserRepository when backend is ready
=======
    { provide: AuthRepository, useClass: MockAuthRepository },
    { provide: UserRepository, useClass: MockUserRepository },
    // TODO: switch to HttpUserRepository when backend is ready
>>>>>>> 8cb614a7ba0b2f4debaf6013311a20ae47bd4897
    providePrimeNG({
      ripple: true,
      theme: {
        preset: ErpPreset,
        options: {
          prefix: 'p',
          darkModeSelector: 'none',
          cssLayer: {
            name: 'primeng',
            // Layer order: theme → base → primeng → components → utilities
            order: 'theme, base, primeng, components, utilities',
          },
        },
      },
    }),

    MessageService,
    ConfirmationService,

    // { provide: PurchaseRepository, useClass: PurchaseRepositoryMock },
    // TODO add base url for API REST
  ],
};