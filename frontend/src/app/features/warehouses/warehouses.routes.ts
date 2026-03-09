import { Routes } from '@angular/router';

export const WAREHOUSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/warehouses/warehouses.page.component').then(m => m.WarehousesPageComponent),
  },
];
