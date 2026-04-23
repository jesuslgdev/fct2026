import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SaleDiscountType } from '@domain/models/sale.model';
import { SaleCreateLineDraft, SaleCreateStore } from '@features/sales/state/sale-create.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { TableComponent } from '@shared/ui/table/table.component';

interface DiscountTypeOption {
  label: string;
  value: 'percent' | 'amount';
}

interface SaleLineEditDraft {
  productId: number | null;
  quantity: string;
  discount: string;
  discountType: SaleDiscountType;
}

@Component({
  selector: 'app-sale-create-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleCreateStore],
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    InputText,
    Select,
    TableModule,
    ButtonComponent,
    CardComponent,
    TableComponent,
  ],
  templateUrl: './sale-create.page.component.html',
})
export class SaleCreatePageComponent implements OnInit {
  readonly store = inject(SaleCreateStore);
  private readonly router = inject(Router);
  readonly editingRowKeys = signal<Record<string, boolean>>({});
  private readonly lineDrafts = signal<Record<number, SaleLineEditDraft>>({});

  readonly discountTypeOptions: DiscountTypeOption[] = [
    { label: '%', value: 'percent' },
    { label: 'Importe', value: 'amount' },
  ];

  ngOnInit(): void {
    void this.store.initialize();
  }

  getLineDraft(lineId: number): SaleLineEditDraft | undefined {
    return this.lineDrafts()[lineId];
  }

  onAddLine(): void {
    if (!this.store.canEditLines()) {
      return;
    }

    this.store.addLine();
  }

  onRemoveLine(lineId: number): void {
    this.clearLineDraft(lineId);
    this.setLineEditing(lineId, false);
    this.store.clearLineStockPreview(lineId);
    this.store.removeLine(lineId);
  }

  onClientChange(clientId: number | null): void {
    this.resetLineEditingState();
    void this.store.onClientChange(clientId);
  }

  onWarehouseChange(warehouseId: number | null): void {
    this.resetLineEditingState();
    void this.store.onWarehouseChange(warehouseId);
  }

  onStartLineEdit(line: SaleCreateLineDraft): void {
    if (!this.store.canEditLines()) {
      return;
    }

    this.lineDrafts.update((drafts) => ({
      ...drafts,
      [line.lineId]: {
        productId: line.productId,
        quantity: String(line.quantity),
        discount: String(line.discount),
        discountType: line.discountType,
      },
    }));
    this.setLineEditing(line.lineId, true);
  }

  onCancelLineEdit(lineId: number): void {
    this.clearLineDraft(lineId);
    this.setLineEditing(lineId, false);
    this.store.clearLineStockPreview(lineId);
  }

  onDraftProductChange(lineId: number, productId: number | null): void {
    this.updateLineDraft(lineId, { productId });
    void this.store.previewLineStock(lineId, productId);
  }

  onDraftQuantityChange(lineId: number, quantity: string | number | null): void {
    this.updateLineDraft(lineId, { quantity: this.stringifyDraftValue(quantity) });
  }

  onDraftDiscountChange(lineId: number, discount: string | number | null): void {
    this.updateLineDraft(lineId, { discount: this.stringifyDraftValue(discount) });
  }

  onDraftDiscountTypeChange(lineId: number, discountType: SaleDiscountType): void {
    this.updateLineDraft(lineId, { discountType });
  }

  async onSaveLineEdit(lineId: number): Promise<void> {
    const draft = this.getLineDraft(lineId);
    if (!draft) {
      this.setLineEditing(lineId, false);
      return;
    }

    await this.store.commitLineEdit(lineId, {
      productId: draft.productId,
      quantity: this.parseDraftNumber(draft.quantity),
      discount: this.parseDraftNumber(draft.discount),
      discountType: draft.discountType,
    });

    this.clearLineDraft(lineId);
    this.setLineEditing(lineId, false);
    this.store.clearLineStockPreview(lineId);
  }

  onSave(): void {
    void this.store.submit();
  }

  onBack(): void {
    void this.router.navigate(['/sales']);
  }

  private resetLineEditingState(): void {
    this.lineDrafts.set({});
    this.editingRowKeys.set({});
    this.store.clearAllLineStockPreviews();
  }

  private updateLineDraft(lineId: number, changes: Partial<SaleLineEditDraft>): void {
    this.lineDrafts.update((drafts) => {
      const currentDraft = drafts[lineId];
      if (!currentDraft) {
        return drafts;
      }

      return {
        ...drafts,
        [lineId]: {
          ...currentDraft,
          ...changes,
        },
      };
    });
  }

  private clearLineDraft(lineId: number): void {
    this.lineDrafts.update((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[lineId];
      return nextDrafts;
    });
  }

  private setLineEditing(lineId: number, isEditing: boolean): void {
    this.editingRowKeys.update((keys) => {
      if (isEditing) {
        return {
          ...keys,
          [String(lineId)]: true,
        };
      }

      const nextKeys = { ...keys };
      delete nextKeys[String(lineId)];
      return nextKeys;
    });
  }

  private stringifyDraftValue(value: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }

  private parseDraftNumber(rawValue: string): number | null {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }
}
