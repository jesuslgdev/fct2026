import { Routes } from '@angular/router';

export const MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/movements/movements.page.component').then(m => m.MovementsPageComponent),
  },
];
