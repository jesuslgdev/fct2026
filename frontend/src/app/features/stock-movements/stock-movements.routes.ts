import { Routes } from '@angular/router';

export const STOCK_MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/movements-list/movements-list.page.component').then(
        (m) => m.MovementsListPageComponent,
      ),
    title: 'Historial de movimientos',
  },
];
