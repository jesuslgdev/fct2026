import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from 'primeng/select';
import type { TablePageEvent } from 'primeng/table';
import { ProductsStore } from '@features/products/state/products.store';
import { ProductSuppliersStore } from '@features/supplier-product/state/product-suppliers.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { ProductStatusBadgeComponent } from '@features/products/components/product-status-badge/product-status-badge.component';
import { ProductFormDialogComponent } from '@features/products/components/product-form-dialog/product-form-dialog.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductsStore, ProductSuppliersStore],
  imports: [
    CurrencyPipe,
    FormsModule,
    Select,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    TableComponent,
    ProductStatusBadgeComponent,
    ProductFormDialogComponent,
  ],
  templateUrl: './product-detail.page.component.html',
})
export class ProductDetailPageComponent implements OnInit {
  readonly store = inject(ProductsStore);
  readonly supplierStore = inject(ProductSuppliersStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.store.error.set('Identificador de producto invalido.');
      return;
    }

    this.store.loadProductById(id);
    void this.supplierStore.loadProductSuppliers(id);
  }

  async openEditFromDetail(): Promise<void> {
    const product = this.store.selectedProduct();
    if (!product || !this.store.canEdit()) {
      return;
    }

    await this.store.openEditDialog(product.productId);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  onProductSuppliersPageChange(event: TablePageEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.supplierStore.productPageSize();
    this.supplierStore.onProductPageChange({ first, rows });
  }

  onSupplierPriceInput(event: Event): void {
    this.supplierStore.setPriceDraft((event.target as HTMLInputElement).value);
  }

  onAddSupplierPriceInput(event: Event): void {
    this.supplierStore.setAddSupplierPriceDraft((event.target as HTMLInputElement).value);
  }
}
