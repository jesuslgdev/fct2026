import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  TableComponent,
} from '@shared/ui';
import { StockAdjustmentDialogComponent } from '@features/warehouses/components/stock-adjustment-dialog/stock-adjustment-dialog.component';
import { WarehouseDetailStore } from '@features/warehouses/state/warehouse-detail.store';

@Component({
  selector: 'app-warehouse-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WarehouseDetailStore],
  imports: [
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    TableComponent,
    StockAdjustmentDialogComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './warehouse-detail.page.component.html',
})
export class WarehouseDetailPageComponent implements OnInit {
  readonly store = inject(WarehouseDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const warehouseId = Number(this.route.snapshot.paramMap.get('warehouseId'));
    this.store.init(warehouseId);
  }

  goBack(): void {
    this.router.navigate(['/warehouses']);
  }
}
