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
import { HttpCategoryRepository } from '@infrastructure/repositories/http/category.repository.http';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { ClientRepository } from '@domain/repositories/client.repository';
import { HttpClientRepository } from '@infrastructure/repositories/http/client.repository.http';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { HttpDepartmentRepository } from '@infrastructure/repositories/http/department.repository.http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { environment } from 'environments/environment';
import { HttpUserRepository } from '@infrastructure/repositories/http/user.repository.http';
import { UserRepository } from '@domain/repositories/user.repository';
import { MockProductRepository } from '@infrastructure/repositories/mock/product.repository.mock';
import { MockProductCategoryRepository } from '@infrastructure/repositories/mock/product-category.repository.mock';
import { ProductRepository } from '@domain/repositories/product.repository';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';

const firebaseApp = initializeApp(environment.firebase);
const firebaseAuth = getAuth(firebaseApp);

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
    { provide: FIREBASE_AUTH, useValue: firebaseAuth },
    { provide: AuthRepository, useClass: FirebaseAuthRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: DepartmentRepository, useClass: HttpDepartmentRepository },
    { provide: ClientRepository, useClass: HttpClientRepository },
    { provide: UserRepository, useClass: HttpUserRepository },
    // Mock repositories (replace with real HTTP implementations when backend is ready)
    { provide: ProductRepository, useClass: MockProductRepository },
    { provide: ProductCategoryRepository, useClass: MockProductCategoryRepository },
    providePrimeNG({
      ripple: true,
      theme: {
        preset: ErpPreset,
        options: {
          prefix: 'p',
          darkModeSelector: 'none',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, components, utilities',
          },
        },
      },
    }),
    MessageService,
    ConfirmationService,

    // TODO add base url for API REST
  ],
};