import { Routes } from '@angular/router';

export const STOCK_BY_WAREHOUSE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/stock-by-warehouse/stock-by-warehouse.page.component').then(m => m.StockByWarehousePageComponent),
  },
];
