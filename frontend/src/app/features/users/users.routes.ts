import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users/users.page.component').then(
        (m) => m.UsersPageComponent,
      ),
    title: 'Gestión de usuarios',
    canActivate: [adminGuard],
  },
];
