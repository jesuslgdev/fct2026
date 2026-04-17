import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { AppShellComponent } from '@shared/ui/app-shell/app-shell.component';
import { UnauthorizedComponent } from '@shared/ui';

export const routes: Routes = [
	// unauthenticated – no guard
	{
		path: 'auth',
		loadChildren: () => import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES),
	},
	{
		path: 'unauthorized',
		component: UnauthorizedComponent,
	},
	// protected layout – guard runs once, shell renders, children fill its <router-outlet>
	{
		path: '',
		component: AppShellComponent,
		canActivate: [authGuard],
		children: [
			// default redirect for authenticated users
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'departments',
			},
			{
				path: 'departments',
				loadChildren: () => import('@features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
			},
			{
				path: 'legal',
				loadChildren: () => import('@features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
			},
			{
				path: 'products',
				loadChildren: () => import('@features/products/products.routes').then(m => m.PRODUCTS_ROUTES),
			},
			{
				path: 'categories',
				loadChildren: () => import('@features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES),
			},
			{
				path: 'clients',
				loadChildren: () => import('@features/clients/clients.routes').then(m => m.CLIENTS_ROUTES),
			},
			{
				path: 'users',
				loadChildren: () => import('@features/users/users.routes').then(m => m.USERS_ROUTES),
			},
			{
				path: 'warehouses',
				loadChildren: () => import('@features/warehouses/warehouses.routes').then(m => m.WAREHOUSES_ROUTES),
			},
			{
				path: 'suppliers',
				loadChildren: () => import('@features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
			},
			{
				path: '',
				redirectTo: 'legal',
				pathMatch: 'full',
			},
			{
				path: '**',
				redirectTo: '',
			},
		],
	},
	{
		path: '**',
		redirectTo: '',
		pathMatch: 'full',
	},
];