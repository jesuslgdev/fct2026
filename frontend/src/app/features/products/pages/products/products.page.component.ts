import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Select } from 'primeng/select';
import type { TablePageEvent } from 'primeng/table';
import { InputComponent } from '@shared/ui/input/input.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { ProductsStore } from '@features/products/state/products.store';
import { Product, ProductCategory } from '@domain/models/product.model';
import { ProductStatusBadgeComponent } from '@features/products/components/product-status-badge/product-status-badge.component';
import { ProductFormDialogComponent } from '@features/products/components/product-form-dialog/product-form-dialog.component';

interface StatusOption {
  label: string;
  value: boolean | null;
}

type CategoryFilterOption = Omit<ProductCategory, 'categoryId'> & {
  categoryId: number | null;
};

@Component({
  selector: 'app-products-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductsStore],
  imports: [
    CurrencyPipe,
    FormsModule,
    Select,
    InputComponent,
    ButtonComponent,
    TableComponent,
    DialogComponent,
    ProductStatusBadgeComponent,
    ProductFormDialogComponent,
  ],
  templateUrl: './products.page.component.html',
})
export class ProductsPageComponent implements OnInit {
  readonly store = inject(ProductsStore);
  private readonly router = inject(Router);

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  readonly categoryFilterOptions = computed<CategoryFilterOption[]>(() => [
    { categoryId: null, name: 'Todas las categorias', description: '' },
    ...this.store.categories(),
  ]);

  ngOnInit(): void {
    this.store.loadProducts();
    this.store.loadCategories();
    this.store.loadLowStockProducts();
  }

  onSearch(query: string): void {
    this.store.setSearchQuery(query);
    this.store.loadProducts();
  }

  onCategoryChange(categoryId: number | null): void {
    this.store.setCategoryFilter(categoryId);
    this.store.loadProducts();
  }

  onStatusChange(active: boolean | null): void {
    this.store.setStatusFilter(active);
    this.store.loadProducts();
  }

  onPageChange(event: TablePageEvent): void {
    const rows = event.rows ?? this.store.pageSize();
    const first = event.first ?? 0;
    const nextPage = Math.floor(first / rows) + 1;

    if (rows !== this.store.pageSize()) {
      this.store.onPageSizeChange(rows);
      return;
    }

    this.store.onPageChange(nextPage);
  }

  async onEdit(product: Product): Promise<void> {
    await this.store.openEditDialog(product.productId);
  }

  onView(product: Product): void {
    this.router.navigate(['/products', product.productId]);
  }

  onToggleStatus(product: Product): void {
    this.store.openConfirmDialog(product);
  }

  async onConfirmToggle(): Promise<void> {
    const product = this.store.productToToggle();
    if (!product) {
      return;
    }

    await this.store.toggleProductStatus(product);
  }
}
