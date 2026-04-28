import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { SaleDetailStore } from '@features/sales/state/sale-detail.store';
import {
  BadgeComponent,
  BadgeVariant,
  ButtonComponent,
  CardComponent,
  TableComponent,
} from '@shared/ui';

@Component({
  selector: 'app-sale-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleDetailStore],
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    TableComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './sale-detail.page.component.html',
})
export class SaleDetailPageComponent implements OnInit {
  readonly store = inject(SaleDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const saleId = Number(this.route.snapshot.paramMap.get('id'));
    void this.store.load(saleId);
  }

  onBack(): void {
    void this.router.navigate(['/sales']);
  }

  getStatusBadgeVariant(status: SaleStatus): BadgeVariant {
    switch (status) {
      case SaleStatus.PENDING:
        return 'warning';
      case SaleStatus.CANCELLED:
        return 'danger';
      case SaleStatus.APPROVED:
      case SaleStatus.IN_PROCESS:
      case SaleStatus.SHIPPED:
      case SaleStatus.DELIVERED:
        return 'success';
      default:
        return 'secondary';
    }
  }

  getStatusBadgeIcon(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.PENDING:
        return 'pi pi-clock';
      case SaleStatus.CANCELLED:
        return 'pi pi-times-circle';
      case SaleStatus.DELIVERED:
        return 'pi pi-check-circle';
      default:
        return 'pi pi-check';
    }
  }
}
