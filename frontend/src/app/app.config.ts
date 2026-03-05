// Application configuration for Angular app
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { ErpPreset } from '@theme/erp.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        // Add authInterceptor when AuthService exists
        // Add errorInterceptor for global error handling
      ])
    ),
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