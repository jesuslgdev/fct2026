// Application configuration for Angular app
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import { ErpPreset } from '@theme/erp.preset';
import { MockAuthRepository } from '@infrastructure/repositories/mock/auth.repository.mock';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { MockUserRepository } from '@infrastructure/repositories/mock/user.repository.mock';
import { UserRepository } from '@domain/repositories/user.repository';
// TODO: switch to FirebaseAuthRepository when backend is ready

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
    { provide: AuthRepository, useClass: MockAuthRepository },
    { provide: UserRepository, useClass: MockUserRepository },
    // TODO: switch to HttpUserRepository when backend is ready
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