import { Routes } from '@angular/router';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/purchases/purchases.page.component').then(
        (m) => m.PurchasesPageComponent,
      ),
    title: 'Compras',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/purchase-detail/purchase-detail.page.component').then(
        (m) => m.PurchaseDetailPageComponent,
      ),
    title: 'Detalle de compra',
  },
];
