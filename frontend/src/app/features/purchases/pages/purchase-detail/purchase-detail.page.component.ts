import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { PurchaseFormDialogComponent } from '@features/purchases/components/purchase-form-dialog/purchase-form-dialog.component';
import { PurchaseDetailStore } from '@features/purchases/state/purchase-detail.store';
import { PurchasesStore } from '@features/purchases/state/purchases.store';
import { PurchaseStatusBadgeComponent } from '@features/purchases/components/purchase-status-badge/purchase-status-badge.component';
import { ButtonComponent, CardComponent, TableComponent } from '@shared/ui';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

@Component({
  selector: 'app-purchase-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PurchaseDetailStore, PurchasesStore],
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonComponent,
    CardComponent,
    TableComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    PurchaseStatusBadgeComponent,
    PurchaseFormDialogComponent,
  ],
  templateUrl: './purchase-detail.page.component.html',
})
export class PurchaseDetailPageComponent implements OnInit {
  readonly store = inject(PurchaseDetailStore);
  readonly purchasesStore = inject(PurchasesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private wasDialogVisible = false;

  constructor() {
    effect(() => {
      const dialogVisible = this.purchasesStore.dialogVisible();

      if (this.wasDialogVisible && !dialogVisible) {
        const purchaseId = this.store.purchase()?.purchaseId;
        if (purchaseId) {
          void this.store.load(purchaseId);
        }
      }

      this.wasDialogVisible = dialogVisible;
    });
  }

  ngOnInit(): void {
    const purchaseId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      this.store.setInvalidRouteError();
      return;
    }

    void this.store.load(purchaseId);
  }

  onBack(): void {
    void this.router.navigate(['/purchases']);
  }

  canEditPurchase(status: PurchaseStatus): boolean {
    return this.purchasesStore.canManage() && status === 'Pending';
  }

  onEditPurchase(purchaseId: number): void {
    this.purchasesStore.openEditDialogById(purchaseId);
  }

  getVatPercent(vatRate: number): number {
    return vatRate <= 1 ? vatRate * 100 : vatRate;
  }

  getStatusLabel(status: PurchaseStatus | null): string {
    return this.store.getStatusLabel(status);
  }
}
