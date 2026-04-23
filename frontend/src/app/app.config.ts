import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
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
import { HttpSupplierRepository } from '@infrastructure/repositories/http/supplier.repository.http';
import { SupplierRepository } from '@domain/repositories/supplier.repository';
import { HttpUserRepository } from '@infrastructure/repositories/http/user.repository.http';
import { UserRepository } from '@domain/repositories/user.repository';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { HttpWarehouseRepository } from '@infrastructure/repositories/http/warehouse.repository.http';
import { StockDistributionRepository } from '@domain/repositories/stock-distribution.repository';
import { HttpStockDistributionRepository } from '@infrastructure/repositories/http/stock-distribution.repository.http';
import { HttpProductRepository } from '@infrastructure/repositories/http/product.repository.http';
import { HttpProductCategoryRepository } from '@infrastructure/repositories/http/product-category.repository.http';
import { AuthService } from '@core/services/auth.service';
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
    { provide: ClientRepository, useClass: HttpClientRepository },
    { provide: UserRepository, useClass: HttpUserRepository },
    { provide: WarehouseRepository, useClass: HttpWarehouseRepository },
    { provide: StockDistributionRepository, useClass: HttpStockDistributionRepository },
    { provide: DepartmentRepository, useClass: HttpDepartmentRepository },
    { provide: SupplierRepository, useClass: HttpSupplierRepository },
    {
      provide: APP_INITIALIZER,
      useFactory: (authRepo: AuthRepository, authService: AuthService) =>
        () => authRepo.restoreSession().then((session) => authService.setSession(session)),
      deps: [AuthRepository, AuthService],
      multi: true,
    },
    { provide: ProductRepository, useClass: HttpProductRepository },
    { provide: ProductCategoryRepository, useClass: HttpProductCategoryRepository },
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
    // { provide: PurchaseRepository, useClass: PurchaseRepositoryMock },
  ],
};
