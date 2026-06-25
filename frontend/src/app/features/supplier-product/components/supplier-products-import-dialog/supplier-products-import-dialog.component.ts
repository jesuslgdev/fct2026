import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { TablePageEvent } from 'primeng/table';
import {
  ButtonComponent,
  CardComponent,
  CheckboxComponent,
  DialogComponent,
  InputComponent,
  TableComponent,
} from '@shared/ui';
import { SupplierProductsStore } from '@features/supplier-product/state/supplier-products.store';

@Component({
  selector: 'app-supplier-products-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    CardComponent,
    CheckboxComponent,
    DialogComponent,
    InputComponent,
    TableComponent,
  ],
  templateUrl: './supplier-products-import-dialog.component.html',
})
export class SupplierProductsImportDialogComponent {
  readonly store = inject(SupplierProductsStore);
  private readonly importInput = viewChild<ElementRef<HTMLInputElement>>('supplierProductsImportInput');

  private getImportInputElement(): HTMLInputElement | null {
    return this.importInput()?.nativeElement ?? null;
  }

  openImportFileSelector(): void {
    const input = this.getImportInputElement();
    if (!input) {
      return;
    }

    input.value = '';
    input.click();
  }

  onImportFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setImportFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onTemplateProductsPageChange(event: TablePageEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.store.templateProductsPageSize();
    this.store.onTemplateProductsPageChange({ first, rows });
  }

  async downloadTemplate(): Promise<void> {
    const blob = await this.store.downloadTemplate();
    if (!blob) {
      return;
    }

    const supplierId = this.store.supplierId();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = supplierId
      ? `supplier-${supplierId}-products-template.xlsx`
      : 'supplier-products-template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  getTemplateProductInputId(productId: number): string {
    return `supplier-template-product-${productId}`;
  }
}
