import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { AppShellComponent } from '@shared/ui/app-shell/app-shell.component';

export const routes: Routes = [
	// unauthenticated – no guard
	{
		path: 'auth',
		loadChildren: () => import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES),
	},
	// protected layout – guard runs once, shell renders, children fill its <router-outlet>
	{
		path: '',
		component: AppShellComponent,
		canActivate: [authGuard],
		children: [
			{
				path: 'departments',
				loadChildren: () => import('@features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
			},
			{
				path: 'legal',
				loadChildren: () => import('@features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
			},
			{
				path: '',
				redirectTo: 'legal',
				pathMatch: 'full',
			},
		],
	},
	// fallback
	{
		path: '**',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
];