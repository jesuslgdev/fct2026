import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/customers/customers.page.component').then(m => m.CustomersPageComponent),
  },
];
