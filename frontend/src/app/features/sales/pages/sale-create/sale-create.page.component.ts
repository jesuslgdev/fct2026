import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly editingRowKeys = signal<Record<string, boolean>>({});

  readonly discountTypeOptions: DiscountTypeOption[] = [
    { label: '%', value: 'percent' },
    { label: 'Importe', value: 'amount' },
  ];

  ngOnInit(): void {
    const saleId = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(saleId) && saleId > 0) {
      void this.store.initializeForEdit(saleId);
      return;
    }

    void this.store.initialize();
  }

  getLineDraft(lineId: number) {
    return this.store.getLineDraft(lineId);
  }

  onAddLine(): void {
    if (!this.store.canEditLines()) {
      return;
    }

    this.store.addLine();
  }

  onRemoveLine(lineId: number): void {
    this.setLineEditing(lineId, false);
    this.store.cancelLineEdit(lineId);
    this.store.removeLine(lineId);
  }

  onClientChange(clientId: number | null): void {
    this.resetLineEditingState();
    void this.store.onClientChange(clientId);
  }

  onWarehouseChange(warehouseId: number | null): void {
    if (this.store.isEditMode()) {
      return;
    }

    this.resetLineEditingState();
    void this.store.onWarehouseChange(warehouseId);
  }

  onDeliveryAddressChange(address: string): void {
    this.store.onDeliveryAddressChange(address);
  }

  onStartLineEdit(line: SaleCreateLineDraft): void {
    if (!this.store.canEditLines()) {
      return;
    }

    this.store.startLineEdit(line);
    this.setLineEditing(line.lineId, true);
  }

  onCancelLineEdit(lineId: number): void {
    this.setLineEditing(lineId, false);
    this.store.cancelLineEdit(lineId);
  }

  onDraftProductChange(lineId: number, productId: number | null): void {
    this.store.onDraftProductChange(lineId, productId);
  }

  onDraftQuantityChange(lineId: number, quantity: string | number | null): void {
    this.store.onDraftQuantityChange(lineId, quantity);
  }

  onDraftDiscountChange(lineId: number, discount: string | number | null): void {
    this.store.onDraftDiscountChange(lineId, discount);
  }

  onDraftDiscountTypeChange(lineId: number, discountType: SaleDiscountType): void {
    this.store.onDraftDiscountTypeChange(lineId, discountType);
  }

  async onSaveLineEdit(lineId: number): Promise<void> {
    await this.store.saveLineEdit(lineId);
    this.setLineEditing(lineId, false);
  }

  onSave(): void {
    void this.store.submit();
  }

  onBack(): void {
    const saleId = this.store.editingSaleId();
    if (this.store.isEditMode() && saleId) {
      void this.router.navigate(['/sales', saleId]);
      return;
    }

    void this.router.navigate(['/sales']);
  }

  private resetLineEditingState(): void {
    this.editingRowKeys.set({});
    this.store.clearAllLineDrafts();
    this.store.clearAllLineStockPreviews();
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
}
