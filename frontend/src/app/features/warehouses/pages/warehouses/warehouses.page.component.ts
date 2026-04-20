import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputComponent } from '@shared/ui/input/input.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { WarehouseFormDialogComponent } from '@features/warehouses/components/warehouse-form-dialog/warehouse-form-dialog.component';
import { Warehouse } from '@domain/models/warehouse.model';

@Component({
  selector: 'app-warehouses-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WarehousesStore],
  imports: [
    FormsModule,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    WarehouseFormDialogComponent,
  ],
  templateUrl: './warehouses.page.component.html',
})
export class WarehousesPageComponent implements OnInit {
  readonly store = inject(WarehousesStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadWarehouses();
  }

  openWarehouseDetail(warehouse: Warehouse): void {
    this.router.navigate(['/warehouses', warehouse.warehouseId]);
  }
}
