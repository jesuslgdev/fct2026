import { Routes } from '@angular/router';
import { salesDepartmentGuard } from '@core/guards/sales-department.guard';

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
    canActivate: [salesDepartmentGuard],
  },
];
