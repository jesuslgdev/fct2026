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
				path: 'legal',
				loadChildren: () => import('@features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
			},
			{
				path: 'products',
				loadChildren: () => import('@features/products/products.routes').then(m => m.PRODUCTS_ROUTES),
			},
			{
				path: 'users',
				loadChildren: () => import('@features/users/users.routes').then(m => m.USERS_ROUTES),
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