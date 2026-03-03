
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';

// @theme/* configure in tsconfig.json
// src/theme/erp.preset.ts → '@theme/erp.preset'
import { ErpPreset } from '@theme/erp.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

   
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    // ── PrimeNG ──
    providePrimeNG({
      ripple: true,
      theme: {
        preset: ErpPreset,
        options: {
          prefix: 'p',
          darkModeSelector: 'none',  
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
    }),

   
    MessageService,       // <p-toast>
    ConfirmationService,  // <p-confirmDialog>

    // ──Infraestructure ──
    // When backend is ready, replace mocks with real repositories:
    //   { provide: PurchaseRepository, useClass: PurchaseRepositoryHttp },
    //
    //   mocks:
    //   { provide: PurchaseRepository, useClass: PurchaseRepositoryMock },
    //
    // TODO add base url for API REST
  ],
};