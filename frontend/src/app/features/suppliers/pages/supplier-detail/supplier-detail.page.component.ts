import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from 'primeng/select';
import type { TablePageEvent } from 'primeng/table';
import { Supplier } from '@domain/models/supplier.model';
import { SupplierProductsImportDialogComponent } from '@features/supplier-product/components/supplier-products-import-dialog/supplier-products-import-dialog.component';
import { SupplierProductsStore } from '@features/supplier-product/state/supplier-products.store';
import { SupplierFormDialogComponent } from '@features/suppliers/components/supplier-form-dialog/supplier-form-dialog.component';
import { SupplierStatusBadgeComponent } from '@features/suppliers/components/supplier-status-badge/supplier-status-badge.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { TableComponent } from '@shared/ui/table/table.component';

@Component({
  selector: 'app-supplier-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SuppliersStore, SupplierProductsStore],
  imports: [
    CurrencyPipe,
    FormsModule,
    Select,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    SupplierFormDialogComponent,
    SupplierStatusBadgeComponent,
    SupplierProductsImportDialogComponent,
    TableComponent,
  ],
  templateUrl: './supplier-detail.page.component.html',
})
export class SupplierDetailPageComponent implements OnInit {
  readonly store = inject(SuppliersStore);
  readonly supplierProductsStore = inject(SupplierProductsStore);
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
      await this.supplierProductsStore.loadSupplierProducts(numericId);
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
    void this.router.navigate(['/suppliers']);
  }

  onSupplierProductsPageChange(event: TablePageEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.supplierProductsStore.supplierPageSize();
    this.supplierProductsStore.onSupplierProductsPageChange({ first, rows });
  }

  onSupplierProductPriceInput(event: Event): void {
    this.supplierProductsStore.setPriceDraft((event.target as HTMLInputElement).value);
  }

  onAddProductPriceInput(event: Event): void {
    this.supplierProductsStore.setAddProductPriceDraft((event.target as HTMLInputElement).value);
  }
}
