import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsStore } from '@features/products/state/products.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { ProductStatusBadgeComponent } from '@features/products/components/product-status-badge/product-status-badge.component';
import { ProductFormDialogComponent } from '@features/products/components/product-form-dialog/product-form-dialog.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductsStore],
  imports: [
    CurrencyPipe,
    ButtonComponent,
    CardComponent,
    ProductStatusBadgeComponent,
    ProductFormDialogComponent,
  ],
  templateUrl: './product-detail.page.component.html',
})
export class ProductDetailPageComponent implements OnInit {
  readonly store = inject(ProductsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly activeDetailView = signal<'warehouses' | 'suppliers'>('warehouses');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.store.error.set('Identificador de producto invalido.');
      return;
    }

    this.store.loadProductDetail(id);
  }

  setDetailView(view: 'warehouses' | 'suppliers'): void {
    this.activeDetailView.set(view);
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
}
