import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clients/clients.page.component').then(
        (m) => m.ClientsPageComponent,
      ),
    title: 'Gestión de clientes',
  },
];
