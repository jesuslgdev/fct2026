import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supplier } from '@domain/models/supplier.model';
import { SupplierFormDialogComponent } from '@features/suppliers/components/supplier-form-dialog/supplier-form-dialog.component';
import { SupplierStatusBadgeComponent } from '@features/suppliers/components/supplier-status-badge/supplier-status-badge.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';

@Component({
  selector: 'app-supplier-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SuppliersStore],
  imports: [
    ButtonComponent,
    CardComponent,
    SupplierFormDialogComponent,
    SupplierStatusBadgeComponent,
  ],
  templateUrl: './supplier-detail.page.component.html',
})
export class SupplierDetailPageComponent implements OnInit {
  readonly store = inject(SuppliersStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly supplier = signal<Supplier | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly supplierNumericId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');
    const numericId = Number(rawId);

    if (!rawId || !Number.isInteger(numericId) || numericId <= 0) {
      this.detailError.set('Identificador de proveedor invalido.');
      return;
    }

    this.supplierNumericId.set(numericId);
    this.detailLoading.set(true);
    try {
      const supplier = await this.store.loadSupplierById(rawId);
      this.supplier.set(supplier);
    } finally {
      this.detailLoading.set(false);
    }
  }

  async openEditFromDetail(): Promise<void> {
    const supplier = this.supplier();
    if (!supplier || !this.store.canEdit()) {
      return;
    }

    await this.store.openEditDialog(supplier);
  }

  goBack(): void {
    this.router.navigate(['/suppliers']);
  }
}
