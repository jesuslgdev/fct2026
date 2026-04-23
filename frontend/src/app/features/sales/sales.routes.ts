import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sales/sales.page.component').then(
        (m) => m.SalesPageComponent,
      ),
    title: 'Gestion de ventas',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/sale-create/sale-create.page.component').then(
        (m) => m.SaleCreatePageComponent,
      ),
    title: 'Nueva venta',
    canActivate: [adminGuard],
  },
];
