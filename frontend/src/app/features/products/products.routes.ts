import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products/products.page.component').then(
        (m) => m.ProductsPageComponent,
      ),
    title: 'Gestion de productos',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.page.component').then(
        (m) => m.ProductDetailPageComponent,
      ),
    title: 'Detalle de producto',
  },
];
