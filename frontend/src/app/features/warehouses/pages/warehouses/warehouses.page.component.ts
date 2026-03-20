import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '@shared/ui/input/input.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { WarehouseFormDialogComponent } from '@features/warehouses/components/warehouse-form-dialog/warehouse-form-dialog.component';

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

  readonly filteredWarehouses = computed(() => {
    const query = this.store.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.store.warehouses();
    }

    return this.store
      .warehouses()
      .filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(query)
          || warehouse.address.toLowerCase().includes(query),
      );
  });

  ngOnInit(): void {
    this.store.loadWarehouses();
  }
}
