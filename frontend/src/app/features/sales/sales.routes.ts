import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sales/sales.page.component').then(
        (m) => m.SalesPageComponent,
      ),
    title: 'Gestion de ventas',
  },
];
