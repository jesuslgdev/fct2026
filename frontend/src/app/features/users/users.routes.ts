import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users/users.page.component').then(m => m.UsersPageComponent),
  },
];
