import { Routes } from '@angular/router';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/purchases/purchases.page.component').then(
        (m) => m.PurchasesPageComponent,
      ),
    title: 'Compras',
  },
];
