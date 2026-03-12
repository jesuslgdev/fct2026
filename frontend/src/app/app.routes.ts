import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('@features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'purchases',
    canActivate: [authGuard],
    loadChildren: () => import('@features/purchases/purchases.routes').then(m => m.PURCHASES_ROUTES),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadChildren: () => import('@features/sales/sales.routes').then(m => m.SALES_ROUTES),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () => import('@features/products/products.routes').then(m => m.PRODUCTS_ROUTES),
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadChildren: () => import('@features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES),
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () => import('@features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES),
  },
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadChildren: () => import('@features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
  },
  {
    path: 'warehouses',
    canActivate: [authGuard],
    loadChildren: () => import('@features/warehouses/warehouses.routes').then(m => m.WAREHOUSES_ROUTES),
  },
  {
    path: 'stock-by-warehouse',
    canActivate: [authGuard],
    loadChildren: () => import('@features/stock-by-warehouse/stock-by-warehouse.routes').then(m => m.STOCK_BY_WAREHOUSE_ROUTES),
  },
  {
    path: 'movements',
    canActivate: [authGuard],
    loadChildren: () => import('@features/movements/movements.routes').then(m => m.MOVEMENTS_ROUTES),
  },
  {
    path: 'departments',
    canActivate: [authGuard],
    loadChildren: () => import('@features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
  },
  {
    path: 'users',
    canActivate: [authGuard],
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
