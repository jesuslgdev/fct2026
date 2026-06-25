import { Routes } from '@angular/router';

export const WAREHOUSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/warehouses/warehouses.page.component').then(
        (m) => m.WarehousesPageComponent,
      ),
    title: 'Gestion de almacenes',
  },
  {
    path: 'movements',
    loadChildren: () =>
      import('@features/stock-movements/stock-movements.routes').then(
        (m) => m.STOCK_MOVEMENTS_ROUTES,
      ),
  },
  {
    path: ':warehouseId',
    loadComponent: () =>
      import('./pages/warehouse-detail/warehouse-detail.page.component').then(
        (m) => m.WarehouseDetailPageComponent,
      ),
    title: 'Detalle de almacen',
  },
];
