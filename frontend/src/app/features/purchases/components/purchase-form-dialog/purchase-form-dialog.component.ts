import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import {
  CreatePurchasePayload,
  PurchaseDetail,
  PurchaseLineInput,
  PurchaseSupplierProductOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { PurchasesStore } from '@features/purchases/state/purchases.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { Select } from 'primeng/select';
import { PurchaseStatusBadgeComponent } from '../purchase-status-badge/purchase-status-badge.component';

interface SelectOption<T = number | null> {
  label: string;
  value: T;
}

interface PurchaseLineDraft {
  productId: number | null;
  productName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  vatRate: number | null;
}

interface PurchaseLineTotals {
  subtotal: number;
  vatAmount: number;
  total: number;
}

@Component({
  selector: 'app-purchase-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    Select,
    DialogComponent,
    InputComponent,
    ButtonComponent,
    PurchaseStatusBadgeComponent,
  ],
  templateUrl: './purchase-form-dialog.component.html',
})
export class PurchaseFormDialogComponent {
  readonly store = inject(PurchasesStore);

  readonly supplierId = signal<number | null>(null);
  readonly deliveryWarehouseId = signal<number | null>(null);
  readonly lines = signal<PurchaseLineDraft[]>([]);
  readonly submitAttempted = signal(false);
  readonly productPickerVisible = signal(false);
  readonly productSearchQuery = signal('');

  private readonly previousSupplierId = signal<number | null>(null);
  private readonly syncInProgress = signal(false);
  private readonly lastSyncKey = signal<string | null>(null);

  readonly isViewMode = computed(() => this.store.dialogMode() === 'view');
  readonly isCreateMode = computed(() => this.store.dialogMode() === 'create');

  readonly dialogTitle = computed(() => {
    switch (this.store.dialogMode()) {
      case 'create':
        return 'Nueva compra';
      case 'edit':
        return 'Editar compra';
      case 'view':
        return 'Detalle de compra';
      default:
        return 'Compra';
    }
  });
  displayNumericValue(value: number | null): number | '' {
    if (value === null || !Number.isFinite(value)) {
      return '';
    }

    return value;
  }

  readonly selectedProductIds = computed(() => {
    const productIds = this.lines()
      .map((line) => line.productId)
      .filter((productId): productId is number => productId !== null);

    return [...new Set(productIds)];
  });

  readonly supplierOptions = computed<SelectOption[]>(() => {
    if (!this.isCreateMode()) {
      return this.store.suppliers().map((supplier) => ({
        label: supplier.supplierName,
        value: supplier.supplierId,
      }));
    }

    const selectedProductIds = this.selectedProductIds();
    if (selectedProductIds.length === 0) {
      return [];
    }

    return this.store
      .suppliers()
      .filter((supplier) => this.supportsAllSelectedProducts(supplier.supplierId, selectedProductIds))
      .map((supplier) => ({
        label: supplier.supplierName,
        value: supplier.supplierId,
      }));
  });

  readonly warehouseOptions = computed<SelectOption[]>(() =>
    this.store.warehouses().map((warehouse) => ({
      label: `${warehouse.warehouseName} (${warehouse.address})`,
      value: warehouse.warehouseId,
    })),
  );

  readonly productOptions = computed<SelectOption[]>(() => {
    if (!this.isCreateMode()) {
      return this.store.supplierProducts().map((product) => ({
        label: `${product.productName} (${this.formatCurrency(product.unitPrice)})`,
        value: product.productId,
      }));
    }

    const byProductId = new Map<number, PurchaseSupplierProductOption>();

    Object.values(this.store.supplierProductsBySupplier()).forEach((supplierProducts) => {
      supplierProducts.forEach((product) => {
        if (!byProductId.has(product.productId)) {
          byProductId.set(product.productId, product);
        }
      });
    });

    return [...byProductId.values()]
      .sort((left, right) => left.productName.localeCompare(right.productName))
      .map((product) => ({
        label: product.productName,
        value: product.productId,
      }));
  });

  readonly filteredProductOptions = computed<SelectOption[]>(() => {
    const selectedProductIds = new Set(this.selectedProductIds());
    const query = this.productSearchQuery().trim().toLowerCase();

    return this.productOptions().filter((option) => {
      if (selectedProductIds.has(option.value as number)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return option.label.toLowerCase().includes(query);
    });
  });

  readonly supplierSelectDisabled = computed(
    () =>
      this.isViewMode() ||
      this.store.loadingOptions() ||
      this.store.loadingSupplierCatalog() ||
      (this.isCreateMode() && this.selectedProductIds().length === 0),
  );

  readonly warehouseSelectDisabled = computed(
    () =>
      this.isViewMode() ||
      this.store.loadingOptions(),
  );

  readonly totals = computed(() =>
    this.lines().reduce<PurchaseLineTotals>(
      (accumulator, line) => {
        const lineTotals = this.getLineTotals(line);

        return {
          subtotal: this.roundCurrency(accumulator.subtotal + lineTotals.subtotal),
          vatAmount: this.roundCurrency(accumulator.vatAmount + lineTotals.vatAmount),
          total: this.roundCurrency(accumulator.total + lineTotals.total),
        };
      },
      {
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ),
  );

  readonly formInvalid = computed(() => {
    if (this.supplierId() === null || this.deliveryWarehouseId() === null) {
      return true;
    }

    const currentLines = this.lines();
    if (currentLines.length === 0) {
      return true;
    }

    return currentLines.some((line) => !this.isLineValid(line));
  });

  constructor() {
    effect(() => {
      const visible = this.store.dialogVisible();
      const mode = this.store.dialogMode();
      const purchase = this.store.selectedPurchase();

      if (!visible) {
        this.lastSyncKey.set(null);
        this.submitAttempted.set(false);
        return;
      }

      const syncKey = `${mode}:${purchase?.purchaseId ?? 'new'}`;
      if (this.lastSyncKey() === syncKey) {
        return;
      }

      this.lastSyncKey.set(syncKey);

      if (mode === 'create') {
        this.initializeCreateMode();
        return;
      }

      if (!purchase) {
        return;
      }

      this.initializeFromPurchase(purchase);
    });

  }

  onSupplierChange(rawValue: number | null): void {
    const supplierId = this.toNullableNumber(rawValue);
    this.supplierId.set(supplierId);

    if (this.syncInProgress() || this.isViewMode()) {
      return;
    }

    if (this.isCreateMode()) {
      if (supplierId === null) {
        this.store.supplierProducts.set([]);
        return;
      }

      const supplierProducts = this.getProductsForSupplier(supplierId);
      this.store.supplierProducts.set(supplierProducts);
      this.repriceLinesForSupplier(supplierId);
      return;
    }

    const previousSupplierId = this.previousSupplierId();
    this.previousSupplierId.set(supplierId);

    if (supplierId === null) {
      this.lines.set([this.createEmptyLine()]);
      return;
    }

    this.store.loadSupplierProducts(supplierId);

    if (previousSupplierId !== null && previousSupplierId !== supplierId) {
      this.lines.set([this.createEmptyLine()]);
    }
  }

  onWarehouseChange(rawValue: number | null): void {
    this.deliveryWarehouseId.set(this.toNullableNumber(rawValue));
  }

  toggleProductPicker(): void {
    this.productPickerVisible.update((value) => !value);
  }

  closeProductPicker(): void {
    this.productPickerVisible.set(false);
  }

  onProductSearchChange(value: string): void {
    this.productSearchQuery.set(value);
  }

  addProductFromPicker(productId: number | null): void {
    if (productId === null) {
      return;
    }

    const selectedProduct = this.resolveProductOption(productId, this.supplierId());
    if (!selectedProduct) {
      return;
    }

    this.lines.update((lines) => [
      ...lines,
      {
        productId,
        productName: selectedProduct.productName,
        quantity: 1,
        unitPrice: this.toNullableNumber(selectedProduct.unitPrice),
        vatRate: this.toNullableNumber(selectedProduct.vatRate),
      },
    ]);

    if (this.isCreateMode()) {
      this.ensureSupplierMatchesSelectedProducts();

      const supplierId = this.supplierId();
      if (supplierId !== null) {
        this.repriceLinesForSupplier(supplierId);
      }
    }
  }

  addLine(): void {
    this.lines.update((lines) => [...lines, this.createEmptyLine()]);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, currentIndex) => currentIndex !== index));

    if (this.isCreateMode()) {
      this.ensureSupplierMatchesSelectedProducts();

      const supplierId = this.supplierId();
      if (supplierId !== null) {
        this.repriceLinesForSupplier(supplierId);
      }
    }
  }

  onProductChange(index: number, rawProductId: number | null): void {
    const productId = this.toNullableNumber(rawProductId);
    const selectedProduct = this.resolveProductOption(productId, this.supplierId());

    this.updateLine(index, {
      productId,
      productName: selectedProduct?.productName ?? null,
      unitPrice: this.toNullableNumber(selectedProduct?.unitPrice),
      vatRate: this.toNullableNumber(selectedProduct?.vatRate),
      quantity: this.lines()[index]?.quantity ?? 1,
    });

    if (this.isCreateMode()) {
      this.ensureSupplierMatchesSelectedProducts();

      const supplierId = this.supplierId();
      if (supplierId !== null) {
        this.repriceLinesForSupplier(supplierId);
      }
    }
  }

  onLineQuantityChange(index: number, value: string): void {
    this.updateLine(index, { quantity: this.toNullableNumber(value) });
  }

  onLineUnitPriceChange(index: number, value: string): void {
    this.updateLine(index, { unitPrice: this.toNullableNumber(value) });
  }

  onLineVatRateChange(index: number, value: string): void {
    this.updateLine(index, { vatRate: this.toNullableNumber(value) });
  }

  onConfirm(): void {
    if (this.isViewMode()) {
      this.store.closeDialog();
      return;
    }

    this.submitAttempted.set(true);

    if (this.formInvalid()) {
      return;
    }

    const supplierId = this.supplierId();
    const deliveryWarehouseId = this.deliveryWarehouseId();
    if (supplierId === null || deliveryWarehouseId === null) {
      return;
    }

    const payloadLines: PurchaseLineInput[] = this.lines().map((line) => ({
      productId: line.productId ?? 0,
      quantity: line.quantity ?? 0,
      unitPrice: line.unitPrice ?? 0,
      vatRate: line.vatRate ?? 0,
    }));

    if (this.store.dialogMode() === 'edit') {
      const payload: UpdatePurchasePayload = {
        supplierId,
        deliveryWarehouseId,
        lines: payloadLines,
      };
      this.store.savePurchase(payload);
      return;
    }

    const payload: CreatePurchasePayload = {
      supplierId,
      deliveryWarehouseId,
      lines: payloadLines,
    };
    this.store.savePurchase(payload);
  }

  onCancel(): void {
    this.store.closeDialog();
  }

  getLineTotals(line: PurchaseLineDraft): PurchaseLineTotals {
    const quantity = line.quantity ?? 0;
    const unitPrice = line.unitPrice ?? 0;
    const vatRate = line.vatRate ?? 0;

    const subtotal = this.roundCurrency(quantity * unitPrice);
    const vatAmount = this.roundCurrency(subtotal * (vatRate / 100));

    return {
      subtotal,
      vatAmount,
      total: this.roundCurrency(subtotal + vatAmount),
    };
  }

  isLineInvalid(index: number): boolean {
    const line = this.lines()[index];
    return !line || !this.isLineValid(line);
  }

  getProductLabel(productId: number | null): string {
    if (productId === null) {
      return 'Producto no seleccionado';
    }

    return this.resolveProductOption(productId, this.supplierId())?.productName ?? `Producto #${productId}`;
  }

  getLineProductLabel(line: PurchaseLineDraft): string {
    if (line.productName && line.productName.trim().length > 0) {
      return line.productName;
    }

    return this.getProductLabel(line.productId);
  }

  statusLabel(status: PurchaseStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Approved':
        return 'Aprobada';
      case 'InProcess':
        return 'En proceso';
      case 'Shipped':
        return 'Enviada';
      case 'Received':
        return 'Recibida';
      case 'Cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private initializeCreateMode(): void {
    this.syncInProgress.set(true);
    this.supplierId.set(null);
    this.deliveryWarehouseId.set(null);
    this.lines.set([]);
    this.submitAttempted.set(false);
    this.productPickerVisible.set(false);
    this.productSearchQuery.set('');
    this.previousSupplierId.set(null);
    this.store.supplierProducts.set([]);
    this.syncInProgress.set(false);
  }

  private initializeFromPurchase(purchase: PurchaseDetail): void {
    this.syncInProgress.set(true);
    this.supplierId.set(purchase.supplierId);
    this.deliveryWarehouseId.set(purchase.deliveryWarehouseId);
    this.previousSupplierId.set(purchase.supplierId);
    this.lines.set(
      purchase.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        quantity: this.toNullableNumber(line.quantity),
        unitPrice: this.toNullableNumber(line.unitPrice),
        vatRate: this.toNullableNumber(line.vatRate),
      })),
    );
    this.submitAttempted.set(false);
    this.productPickerVisible.set(false);
    this.productSearchQuery.set('');
    this.syncInProgress.set(false);
  }

  private createEmptyLine(): PurchaseLineDraft {
    return {
      productId: null,
      productName: null,
      quantity: 1,
      unitPrice: null,
      vatRate: null,
    };
  }

  private isLineValid(line: PurchaseLineDraft): boolean {
    if (line.productId === null) {
      return false;
    }

    if (line.quantity === null || line.quantity <= 0) {
      return false;
    }

    if (line.unitPrice === null || line.unitPrice < 0) {
      return false;
    }

    if (line.vatRate === null || line.vatRate < 0 || line.vatRate > 100) {
      return false;
    }

    return true;
  }

  private updateLine(index: number, patch: Partial<PurchaseLineDraft>): void {
    this.lines.update((lines) =>
      lines.map((line, currentIndex) =>
        currentIndex === index
          ? {
              ...line,
              ...patch,
            }
          : line,
      ),
    );
  }

  private toNullableNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private supportsAllSelectedProducts(supplierId: number, selectedProductIds: number[]): boolean {
    if (selectedProductIds.length === 0) {
      return false;
    }

    const productIdsForSupplier = new Set(
      this.getProductsForSupplier(supplierId).map((product) => product.productId),
    );

    return selectedProductIds.every((productId) => productIdsForSupplier.has(productId));
  }

  private ensureSupplierMatchesSelectedProducts(): void {
    const supplierId = this.supplierId();
    if (supplierId === null) {
      return;
    }

    const selectedProductIds = this.selectedProductIds();
    if (selectedProductIds.length === 0) {
      this.supplierId.set(null);
      this.store.supplierProducts.set([]);
      return;
    }

    const isCompatible = this.supportsAllSelectedProducts(supplierId, selectedProductIds);
    if (!isCompatible) {
      this.supplierId.set(null);
      this.store.supplierProducts.set([]);
    }
  }

  private repriceLinesForSupplier(supplierId: number): void {
    const productsById = new Map(
      this.getProductsForSupplier(supplierId).map((product) => [product.productId, product]),
    );

    this.lines.update((lines) =>
      lines.map((line) => {
        if (line.productId === null) {
          return line;
        }

        const supplierProduct = productsById.get(line.productId);
        if (!supplierProduct) {
          return line;
        }

        return {
          ...line,
          unitPrice: this.toNullableNumber(supplierProduct.unitPrice),
          vatRate: this.toNullableNumber(supplierProduct.vatRate),
        };
      }),
    );
  }

  private resolveProductOption(
    productId: number | null,
    supplierId: number | null,
  ): PurchaseSupplierProductOption | undefined {
    if (productId === null) {
      return undefined;
    }

    if (supplierId !== null) {
      const supplierProduct = this
        .getProductsForSupplier(supplierId)
        .find((product) => product.productId === productId);

      if (supplierProduct) {
        return supplierProduct;
      }
    }

    const selectedSupplierProducts = this.store
      .supplierProducts()
      .find((product) => product.productId === productId);

    if (selectedSupplierProducts) {
      return selectedSupplierProducts;
    }

    return Object.values(this.store.supplierProductsBySupplier())
      .flat()
      .find((product) => product.productId === productId);
  }

  private getProductsForSupplier(supplierId: number): PurchaseSupplierProductOption[] {
    return this.store.supplierProductsBySupplier()[supplierId] ?? [];
  }
}
