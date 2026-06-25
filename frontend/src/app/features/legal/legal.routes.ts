import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'terms',
    pathMatch: 'full',
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/terms/terms.page.component').then(m => m.TermsPageComponent),
    title: 'Terms and Conditions',
  },
];
