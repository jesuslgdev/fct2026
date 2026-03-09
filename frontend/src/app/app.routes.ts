import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'dashboard',
		loadChildren: () => import('@features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
	},
	{
		path: 'purchases',
		loadChildren: () => import('@features/purchases/purchases.routes').then(m => m.PURCHASES_ROUTES),
	},
	{
		path: 'sales',
		loadChildren: () => import('@features/sales/sales.routes').then(m => m.SALES_ROUTES),
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
		path: 'customers',
		loadChildren: () => import('@features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES),
	},
	{
		path: 'suppliers',
		loadChildren: () => import('@features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
	},
	{
		path: 'warehouses',
		loadChildren: () => import('@features/warehouses/warehouses.routes').then(m => m.WAREHOUSES_ROUTES),
	},
	{
		path: 'stock-by-warehouse',
		loadChildren: () => import('@features/stock-by-warehouse/stock-by-warehouse.routes').then(m => m.STOCK_BY_WAREHOUSE_ROUTES),
	},
	{
		path: 'movements',
		loadChildren: () => import('@features/movements/movements.routes').then(m => m.MOVEMENTS_ROUTES),
	},
	{
		path: 'departments',
		loadChildren: () => import('@features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
	},
	{
		path: 'users',
		loadChildren: () => import('@features/users/users.routes').then(m => m.USERS_ROUTES),
	},
	{
		path: 'legal',
		loadChildren: () => import('@features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
	},
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
];
