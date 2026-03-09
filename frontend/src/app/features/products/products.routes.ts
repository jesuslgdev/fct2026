import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/products/products.page.component').then(m => m.ProductsPageComponent),
  },
];
