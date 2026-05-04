import { Routes } from '@angular/router';

export const SUPPLIERS_ROUTES: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./pages/suppliers/suppliers.page.component').then(
				(m) => m.SuppliersPageComponent,
			),
		title: 'Proveedores',
	},
	{
		path: ':id',
		loadComponent: () =>
			import('./pages/supplier-detail/supplier-detail.page.component').then(
				(m) => m.SupplierDetailPageComponent,
			),
		title: 'Detalle de proveedor',
	},
];
