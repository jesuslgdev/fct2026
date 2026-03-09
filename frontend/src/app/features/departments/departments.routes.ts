import { Routes } from '@angular/router';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/departments/departments.page.component').then(m => m.DepartmentsPageComponent),
  },
];
