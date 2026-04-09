import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categories/categories.page.component').then(
        (m) => m.CategoriesPageComponent,
      ),
    title: 'Gestión de categorías',
  },
];
