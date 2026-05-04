import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Client, ClientDetail, ClientQueryParams } from '@domain/models/client.model';
import { Product, ProductQueryParams, ProductStockByWarehouse } from '@domain/models/product.model';
import {
  SaleApiError,
  SaleClientNotActiveError,
  SaleEmptyLinesError,
  SaleForbiddenError,
  SaleInsufficientStockError,
  SaleInvalidDiscountError,
  SaleProductNotActiveError,
  SaleUnauthorizedError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { CreateSale, SaleDetail, SaleDiscountType, UpdateSale } from '@domain/models/sale.model';
import { Warehouse } from '@domain/models/warehouse.model';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { GetProductStockByWarehousesUseCase } from '@domain/usecases/product/get-product-stock-by-warehouses.usecase';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { CreateSaleUseCase } from '@domain/usecases/sales/create-sale.usecase';
import { GetSaleUseCase } from '@domain/usecases/sales/get-sale.usecase';
import { UpdateSaleUseCase } from '@domain/usecases/sales/update-sale.usecase';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';

export interface SaleCreateLineDraft {
  lineId: number;
  productId: number | null;
  quantity: number;
  discount: number;
  discountType: SaleDiscountType;
  availableStock: number | null;
  stockLoading: boolean;
  stockError: string | null;
  validationError: string | null;
}

export interface SaleCreateLineView extends SaleCreateLineDraft {
  productName: string;
  productCode: string;
  unitPrice: number;
  vatRate: number;
  grossAmount: number;
  discountAmount: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface SaleCreateLineEditChanges {
  productId: number | null;
  quantity: number | null;
  discount: number | null;
  discountType: SaleDiscountType;
}

export interface SaleCreateLineEditDraft {
  productId: number | null;
  quantity: string;
  discount: string;
  discountType: SaleDiscountType;
}

export interface SaleCreateLineStockPreview {
  availableStock: number | null;
  stockLoading: boolean;
  stockError: string | null;
}

@Injectable()
export class SaleCreateStore {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly getClientByIdUseCase = inject(GetClientByIdUseCase);
  private readonly getWarehousesUseCase = inject(GetWarehousesUseCase);
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly getProductStockByWarehousesUseCase = inject(GetProductStockByWarehousesUseCase);
  private readonly createSaleUseCase = inject(CreateSaleUseCase);
  private readonly getSaleUseCase = inject(GetSaleUseCase);
  private readonly updateSaleUseCase = inject(UpdateSaleUseCase);

  private lineSequence = 1;

  private readonly clientsState = signal<Client[]>([]);
  private readonly warehousesState = signal<Warehouse[]>([]);
  private readonly productsState = signal<Product[]>([]);
  private readonly linesState = signal<SaleCreateLineDraft[]>([]);
  private readonly lineDraftsState = signal<Record<number, SaleCreateLineEditDraft>>({});
  private readonly lineStockPreviewsState = signal<Record<number, SaleCreateLineStockPreview>>({});
  private readonly selectedClientIdState = signal<number | null>(null);
  private readonly selectedWarehouseIdState = signal<number | null>(null);
  private readonly selectedClientDetailState = signal<ClientDetail | null>(null);
  private readonly isEditModeState = signal(false);
  private readonly editingSaleIdState = signal<number | null>(null);
  private readonly editingSaleNumberState = signal<string | null>(null);
  private readonly editingSaleStatusState = signal<SaleStatus | null>(null);
  private readonly deliveryAddressOverrideState = signal('');

  private readonly loadingState = signal(false);
  private readonly loadingProductsState = signal(false);
  private readonly loadingClientDetailState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successMessageState = signal<string | null>(null);

  readonly clients = this.clientsState.asReadonly();
  readonly warehouses = this.warehousesState.asReadonly();
  readonly products = this.productsState.asReadonly();
  readonly lines = this.linesState.asReadonly();
  readonly lineDrafts = this.lineDraftsState.asReadonly();
  readonly lineStockPreviews = this.lineStockPreviewsState.asReadonly();

  readonly selectedClientId = this.selectedClientIdState.asReadonly();
  readonly selectedWarehouseId = this.selectedWarehouseIdState.asReadonly();
  readonly selectedClientDetail = this.selectedClientDetailState.asReadonly();
  readonly isEditMode = this.isEditModeState.asReadonly();
  readonly editingSaleId = this.editingSaleIdState.asReadonly();
  readonly editingSaleNumber = this.editingSaleNumberState.asReadonly();
  readonly editingSaleStatus = this.editingSaleStatusState.asReadonly();
  readonly deliveryAddressOverride = this.deliveryAddressOverrideState.asReadonly();

  readonly loading = this.loadingState.asReadonly();
  readonly loadingProducts = this.loadingProductsState.asReadonly();
  readonly loadingClientDetail = this.loadingClientDetailState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly successMessage = this.successMessageState.asReadonly();

  readonly canEditLines = computed(() =>
    this.selectedClientId() !== null && this.selectedWarehouseId() !== null,
  );

  readonly deliveryAddress = computed(() => {
    if (this.isEditMode()) {
      return this.deliveryAddressOverride().trim();
    }

    const client = this.selectedClientDetail();
    if (!client) {
      return '';
    }

    return [client.address, client.city, client.province, client.postalCode]
      .filter((part) => part.trim().length > 0)
      .join(', ');
  });

  readonly creatorName = computed(() => {
    const user = this.authService.user();
    return user?.displayName?.trim() || user?.email || 'Usuario actual';
  });

  readonly lineViews = computed<SaleCreateLineView[]>(() =>
    this.buildLineViews(this.lines().map((line) => this.resolveEffectiveLine(line))),
  );

  readonly lineViewMap = computed(() => {
    const entries = this.lineViews().map((line) => [line.lineId, line] as const);
    return new Map<number, SaleCreateLineView>(entries);
  });

  readonly subtotal = computed(() =>
    this.lineViews().reduce((sum, line) => sum + line.lineSubtotal, 0),
  );

  readonly taxes = computed(() =>
    this.lineViews().reduce((sum, line) => sum + line.lineTax, 0),
  );

  readonly total = computed(() => this.subtotal() + this.taxes());

  readonly canSubmit = computed(() => {
    if (this.submitting() || this.loading() || this.loadingProducts() || this.loadingClientDetail()) {
      return false;
    }

    if (this.isEditMode() && this.editingSaleStatus() !== SaleStatus.PENDING) {
      return false;
    }

    if (!this.selectedClientId() || !this.selectedWarehouseId() || !this.deliveryAddress()) {
      return false;
    }

    if (Object.keys(this.lineDrafts()).length > 0) {
      return false;
    }

    const views = this.lineViews();
    return views.length > 0 && views.every((line) => this.validateLine(line) === null);
  });

  readonly availableProducts = computed(() =>
    this.products()
      .filter((product) => product.isActive)
      .sort((left, right) => left.name.localeCompare(right.name)),
  );

  async initialize(): Promise<void> {
    this.resetFormState();
    this.errorState.set(null);
    this.successMessageState.set(null);
    this.ensureAtLeastOneLine();
    this.loadingState.set(true);

    try {
      const [clients, warehouses, products] = await Promise.all([
        this.loadAllActiveClients(),
        firstValueFrom(this.getWarehousesUseCase.execute()),
        this.loadAllActiveProducts(),
      ]);

      this.clientsState.set(clients);
      this.warehousesState.set(warehouses);
      this.productsState.set(products);
    } catch (err) {
      this.errorState.set(this.resolveLoadError(err));
    } finally {
      this.loadingState.set(false);
    }
  }

  async initializeForEdit(saleId: number): Promise<void> {
    this.resetFormState();
    this.isEditModeState.set(true);
    this.editingSaleIdState.set(saleId);
    this.errorState.set(null);
    this.successMessageState.set(null);
    this.loadingState.set(true);

    try {
      const [clients, warehouses, products, sale] = await Promise.all([
        this.loadAllActiveClients(),
        firstValueFrom(this.getWarehousesUseCase.execute()),
        this.loadAllActiveProducts(),
        firstValueFrom(this.getSaleUseCase.execute(saleId)),
      ]);

      this.clientsState.set(clients);
      this.warehousesState.set(warehouses);
      this.productsState.set(products);
      this.hydrateFromSale(sale);

      if (sale.status !== SaleStatus.PENDING) {
        this.errorState.set('Solo se pueden editar ventas en estado pendiente.');
      }

      await this.refreshAllLineStocks();
    } catch (err) {
      this.errorState.set(this.resolveLoadError(err));
    } finally {
      this.loadingState.set(false);
    }
  }

  addLine(): void {
    this.linesState.update((lines) => [...lines, this.createEmptyLine()]);
  }

  removeLine(lineId: number): void {
    this.clearLineDraft(lineId);
    this.clearLineStockPreview(lineId);
    this.linesState.update((lines) => {
      const remaining = lines.filter((line) => line.lineId !== lineId);
      return remaining.length > 0 ? remaining : [this.createEmptyLine()];
    });
  }

  startLineEdit(line: SaleCreateLineDraft): void {
    this.lineDraftsState.update((drafts) => ({
      ...drafts,
      [line.lineId]: {
        productId: line.productId,
        quantity: String(line.quantity),
        discount: String(line.discount),
        discountType: line.discountType,
      },
    }));
  }

  getLineDraft(lineId: number): SaleCreateLineEditDraft | undefined {
    return this.lineDrafts()[lineId];
  }

  cancelLineEdit(lineId: number): void {
    this.clearLineDraft(lineId);
    this.clearLineStockPreview(lineId);
  }

  clearAllLineDrafts(): void {
    this.lineDraftsState.set({});
  }

  async onClientChange(clientId: number | null): Promise<void> {
    this.selectedClientIdState.set(clientId);
    this.selectedClientDetailState.set(null);
    this.errorState.set(null);
    if (this.isEditMode() && !clientId) {
      this.deliveryAddressOverrideState.set('');
    }

    if (!clientId) {
      return;
    }

    this.loadingClientDetailState.set(true);

    try {
      const client = await firstValueFrom(this.getClientByIdUseCase.execute(clientId));
      this.selectedClientDetailState.set(client);
      if (this.isEditMode()) {
        this.deliveryAddressOverrideState.set(this.formatClientDeliveryAddress(client));
      }
    } catch (err) {
      this.errorState.set(this.resolveLoadError(err));
    } finally {
      this.loadingClientDetailState.set(false);
    }
  }

  async onWarehouseChange(warehouseId: number | null): Promise<void> {
    this.selectedWarehouseIdState.set(warehouseId);
    this.errorState.set(null);
    this.clearAllLineStockPreviews();

    if (!warehouseId) {
      this.linesState.update((lines) =>
        lines.map((line) => ({
          ...line,
          availableStock: null,
          stockLoading: false,
          stockError: null,
          validationError: this.validateLine({
            ...line,
            availableStock: null,
            stockLoading: false,
            stockError: null,
          }),
        })),
      );
      return;
    }

    await this.refreshAllLineStocks();
  }

  async onProductChange(lineId: number, productId: number | null): Promise<void> {
    const line = this.lines().find((item) => item.lineId === lineId);
    if (!line) {
      return;
    }

    await this.commitLineEdit(lineId, {
      productId,
      quantity: line.quantity,
      discount: line.discount,
      discountType: line.discountType,
    });
  }

  onDeliveryAddressChange(address: string): void {
    if (!this.isEditMode()) {
      return;
    }

    this.deliveryAddressOverrideState.set(address);
  }

  onDraftProductChange(lineId: number, productId: number | null): void {
    this.updateLineDraft(lineId, { productId });
    void this.previewLineStock(lineId, productId);
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

  async saveLineEdit(lineId: number): Promise<void> {
    const draft = this.getLineDraft(lineId);
    if (!draft) {
      return;
    }

    await this.commitLineEdit(lineId, {
      productId: draft.productId,
      quantity: this.parseDraftNumber(draft.quantity),
      discount: this.parseDraftNumber(draft.discount),
      discountType: draft.discountType,
    });

    this.clearLineDraft(lineId);
    this.clearLineStockPreview(lineId);
  }

  onQuantityChange(lineId: number, rawValue: number | null): void {
    const line = this.lines().find((item) => item.lineId === lineId);
    if (!line) {
      return;
    }

    void this.commitLineEdit(lineId, {
      productId: line.productId,
      quantity: rawValue,
      discount: line.discount,
      discountType: line.discountType,
    });
  }

  onDiscountChange(lineId: number, rawValue: number | null): void {
    const line = this.lines().find((item) => item.lineId === lineId);
    if (!line) {
      return;
    }

    void this.commitLineEdit(lineId, {
      productId: line.productId,
      quantity: line.quantity,
      discount: rawValue,
      discountType: line.discountType,
    });
  }

  onDiscountTypeChange(lineId: number, discountType: SaleDiscountType): void {
    const line = this.lines().find((item) => item.lineId === lineId);
    if (!line) {
      return;
    }

    void this.commitLineEdit(lineId, {
      productId: line.productId,
      quantity: line.quantity,
      discount: line.discount,
      discountType,
    });
  }

  async commitLineEdit(lineId: number, changes: SaleCreateLineEditChanges): Promise<void> {
    const currentLine = this.lines().find((line) => line.lineId === lineId);
    if (!currentLine) {
      return;
    }

    const productChanged = currentLine.productId !== changes.productId;
    const nextLine: SaleCreateLineDraft = {
      ...currentLine,
      productId: changes.productId,
      quantity: this.normalizeQuantity(changes.quantity),
      discount: this.normalizeDiscount(changes.discount),
      discountType: changes.discountType,
      ...(productChanged
        ? {
            availableStock: null,
            stockLoading: false,
            stockError: null,
          }
        : {}),
    };

    this.linesState.update((lines) =>
      lines.map((line) => (line.lineId === lineId ? nextLine : line)),
    );

    if (
      productChanged &&
      nextLine.productId &&
      this.selectedWarehouseId() &&
      !this.hasDuplicateProduct(lineId, nextLine.productId)
    ) {
      await this.refreshLineStock(lineId);
      return;
    }

    this.revalidateLine(lineId);
  }

  async previewLineStock(lineId: number, productId: number | null): Promise<void> {
    const warehouseId = this.selectedWarehouseId();

    if (!productId || !warehouseId) {
      this.clearLineStockPreview(lineId);
      return;
    }

    this.lineStockPreviewsState.update((previews) => ({
      ...previews,
      [lineId]: {
        availableStock: null,
        stockLoading: true,
        stockError: null,
      },
    }));

    try {
      const stocks = await firstValueFrom(
        this.getProductStockByWarehousesUseCase.execute(productId),
      );
      const stockForWarehouse = this.findStockForWarehouse(stocks, warehouseId);

      this.lineStockPreviewsState.update((previews) => ({
        ...previews,
        [lineId]: {
          availableStock: stockForWarehouse?.currentStock ?? 0,
          stockLoading: false,
          stockError: null,
        },
      }));
    } catch {
      this.lineStockPreviewsState.update((previews) => ({
        ...previews,
        [lineId]: {
          availableStock: null,
          stockLoading: false,
          stockError: 'No se ha podido consultar el stock del almacén seleccionado.',
        },
      }));
    }
  }

  getLineStockPreview(lineId: number): SaleCreateLineStockPreview | undefined {
    return this.lineStockPreviews()[lineId];
  }

  clearLineStockPreview(lineId: number): void {
    this.lineStockPreviewsState.update((previews) => {
      const nextPreviews = { ...previews };
      delete nextPreviews[lineId];
      return nextPreviews;
    });
  }

  clearAllLineStockPreviews(): void {
    this.lineStockPreviewsState.set({});
  }

  async submit(): Promise<void> {
    this.errorState.set(null);
    this.successMessageState.set(null);

    const payload = this.isEditMode() ? this.buildUpdatePayload() : this.buildPayload();
    const saleId = this.editingSaleId();
    if (!payload || (this.isEditMode() && !saleId)) {
      return;
    }

    this.submittingState.set(true);

    try {
      if (this.isEditMode()) {
        const updatedSale = await firstValueFrom(
          this.updateSaleUseCase.execute(saleId as number, payload as UpdateSale),
        );
        this.successMessageState.set('La venta se ha actualizado correctamente.');
        await this.router.navigate(['/sales', updatedSale.saleId]);
      } else {
        await firstValueFrom(this.createSaleUseCase.execute(payload as CreateSale));
        this.successMessageState.set('La venta se ha creado correctamente.');
        await this.router.navigate(['/sales']);
      }
    } catch (err) {
      this.errorState.set(this.resolveSubmitError(err));
    } finally {
      this.submittingState.set(false);
    }
  }

  private resetFormState(): void {
    this.lineSequence = 1;
    this.clientsState.set([]);
    this.warehousesState.set([]);
    this.productsState.set([]);
    this.linesState.set([]);
    this.lineDraftsState.set({});
    this.lineStockPreviewsState.set({});
    this.selectedClientIdState.set(null);
    this.selectedWarehouseIdState.set(null);
    this.selectedClientDetailState.set(null);
    this.isEditModeState.set(false);
    this.editingSaleIdState.set(null);
    this.editingSaleNumberState.set(null);
    this.editingSaleStatusState.set(null);
    this.deliveryAddressOverrideState.set('');
  }

  private async refreshAllLineStocks(): Promise<void> {
    const linesWithProduct = this.lines().filter((line) => line.productId !== null);
    await Promise.all(linesWithProduct.map((line) => this.refreshLineStock(line.lineId)));
  }

  private async refreshLineStock(lineId: number): Promise<void> {
    const line = this.lines().find((item) => item.lineId === lineId);
    const warehouseId = this.selectedWarehouseId();

    if (!line || !line.productId || !warehouseId) {
      this.revalidateLine(lineId);
      return;
    }

    this.linesState.update((lines) =>
      lines.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              stockLoading: true,
              stockError: null,
            }
          : item,
      ),
    );

    try {
      const stocks = await firstValueFrom(
        this.getProductStockByWarehousesUseCase.execute(line.productId),
      );
      const stockForWarehouse = this.findStockForWarehouse(stocks, warehouseId);

      this.linesState.update((lines) =>
        lines.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                availableStock: stockForWarehouse?.currentStock ?? 0,
                stockLoading: false,
                stockError: null,
              }
            : item,
        ),
      );
    } catch {
      this.linesState.update((lines) =>
        lines.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                availableStock: null,
                stockLoading: false,
                stockError: 'No se ha podido consultar el stock del almacén seleccionado.',
              }
            : item,
        ),
      );
    }

    this.revalidateLine(lineId);
  }

  private revalidateLine(lineId: number): void {
    this.linesState.update((lines) =>
      lines.map((line) =>
        line.lineId === lineId
          ? {
              ...line,
              validationError: this.validateLine(line),
            }
          : line,
      ),
    );
  }

  private validateAllLines(): boolean {
    let isValid = true;

    this.linesState.update((lines) =>
      lines.map((line) => {
        const validationError = this.validateLine(line);
        if (validationError) {
          isValid = false;
        }

        return {
          ...line,
          validationError,
        };
      }),
    );

    return isValid;
  }

  private validateLine(line: SaleCreateLineDraft | SaleCreateLineView): string | null {
    return this.validateLineAgainstLines(line, this.lines());
  }

  private validateLineAgainstLines(
    line: SaleCreateLineDraft | SaleCreateLineView,
    lines: SaleCreateLineDraft[],
  ): string | null {
    if (!line.productId) {
      return 'Selecciona un producto.';
    }

    const product = this.findProduct(line.productId);
    if (!product || !product.isActive) {
      return 'Solo se pueden seleccionar productos activos.';
    }

    if (this.hasDuplicateProductInLines(lines, line.lineId, line.productId)) {
      return 'Este producto ya está añadido en otra línea.';
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return 'La cantidad debe ser un número entero mayor que 0.';
    }

    if (!this.selectedWarehouseId()) {
      return 'Selecciona primero un almacén para validar el stock.';
    }

    if (line.stockLoading) {
      return 'Consultando stock disponible...';
    }

    if (line.stockError) {
      return line.stockError;
    }

    if (line.availableStock === null) {
      return 'El stock aún no está disponible para esta línea.';
    }

    if (line.quantity > line.availableStock) {
      return 'La cantidad no puede superar el stock disponible.';
    }

    if (line.discount < 0) {
      return 'El descuento no puede ser negativo.';
    }

    if (line.discountType === 'percent' && line.discount >= 100) {
      return 'El descuento porcentual debe ser inferior al 100%.';
    }

    const grossAmount = (product.price ?? 0) * line.quantity;
    const discountAmount = this.calculateDiscountAmount(
      grossAmount,
      line.discount,
      line.discountType,
    );

    if (discountAmount >= grossAmount && grossAmount > 0) {
      return 'El descuento no puede dejar el subtotal de línea en negativo.';
    }

    return null;
  }

  private buildPayload(): CreateSale | null {
    if (!this.selectedClientId()) {
      this.errorState.set('Selecciona un cliente antes de guardar.');
      return null;
    }

    if (!this.selectedWarehouseId()) {
      this.errorState.set('Selecciona un almacén antes de guardar.');
      return null;
    }

    if (!this.lines().length) {
      this.errorState.set('Añade al menos una línea antes de guardar.');
      return null;
    }

    const linesAreValid = this.validateAllLines();
    if (!linesAreValid) {
      this.errorState.set('Revisa los datos de las líneas antes de guardar la venta.');
      return null;
    }

    const payloadLines = this.lines()
      .filter((line) => line.productId !== null)
      .map((line) => ({
        productId: line.productId as number,
        quantity: line.quantity,
        ...(line.discount > 0 ? { discount: line.discount, discountType: line.discountType } : {}),
      }));

    if (!payloadLines.length) {
      this.errorState.set('Añade al menos una línea válida antes de guardar.');
      return null;
    }

    return {
      clientId: this.selectedClientId() as number,
      warehouseId: this.selectedWarehouseId() as number,
      lines: payloadLines,
    };
  }

  private calculateDiscountAmount(
    grossAmount: number,
    discount: number,
    discountType: SaleDiscountType,
  ): number {
    if (discount <= 0) {
      return 0;
    }

    if (discountType === 'percent') {
      return grossAmount * (discount / 100);
    }

    return discount;
  }

  private normalizeQuantity(rawValue: number | null): number {
    return rawValue == null || Number.isNaN(rawValue) ? 0 : Math.trunc(rawValue);
  }

  private normalizeDiscount(rawValue: number | null): number {
    return rawValue == null || Number.isNaN(rawValue) ? 0 : rawValue;
  }

  private buildUpdatePayload(): UpdateSale | null {
    if (!this.selectedClientId()) {
      this.errorState.set('Selecciona un cliente antes de guardar.');
      return null;
    }

    if (!this.deliveryAddress()) {
      this.errorState.set('Indica una dirección de entrega antes de guardar.');
      return null;
    }

    if (!this.lines().length) {
      this.errorState.set('Añade al menos una línea antes de guardar.');
      return null;
    }

    const linesAreValid = this.validateAllLines();
    if (!linesAreValid) {
      this.errorState.set('Revisa los datos de las líneas antes de guardar la venta.');
      return null;
    }

    const payloadLines = this.lines()
      .filter((line) => line.productId !== null)
      .map((line) => ({
        productId: line.productId as number,
        quantity: line.quantity,
        ...(line.discount > 0 ? { discount: line.discount, discountType: line.discountType } : {}),
      }));

    if (!payloadLines.length) {
      this.errorState.set('Añade al menos una línea válida antes de guardar.');
      return null;
    }

    return {
      clientId: this.selectedClientId() as number,
      deliveryAddress: this.deliveryAddress(),
      lines: payloadLines,
    };
  }

  private hydrateFromSale(sale: SaleDetail): void {
    this.editingSaleIdState.set(sale.saleId);
    this.editingSaleNumberState.set(sale.saleNumber);
    this.editingSaleStatusState.set(sale.status);
    this.selectedClientIdState.set(sale.clientId);
    this.selectedWarehouseIdState.set(sale.warehouseId);
    this.deliveryAddressOverrideState.set(sale.deliveryAddress);
    this.linesState.set(
      sale.lines.map((line) => ({
        lineId: this.lineSequence++,
        productId: line.productId,
        quantity: line.quantity,
        ...this.mapSaleLineDiscountForEditing(line),
        availableStock: null,
        stockLoading: false,
        stockError: null,
        validationError: null,
      })),
    );
    this.ensureAtLeastOneLine();
  }

  private parseDraftNumber(rawValue: string): number | null {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      return null;
    }

    const normalizedValue = trimmedValue.replace(',', '.');
    const parsedValue = Number(normalizedValue);

    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  private stringifyDraftValue(value: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }

  private mapSaleLineDiscountForEditing(
    line: SaleDetail['lines'][number],
  ): Pick<SaleCreateLineDraft, 'discount' | 'discountType'> {
    if (line.discountType === 'percent') {
      return {
        discount: line.discount * 100,
        discountType: 'percent',
      };
    }

    const grossAmount = line.unitPrice * line.quantity;

    return {
      discount: grossAmount * line.discount,
      discountType: 'amount',
    };
  }

  private formatClientDeliveryAddress(client: ClientDetail): string {
    return [client.address, client.city, client.province, client.postalCode]
      .filter((part) => part.trim().length > 0)
      .join(', ');
  }

  private findProduct(productId: number | null): Product | undefined {
    return this.products().find((product) => product.productId === productId);
  }

  getLineView(lineId: number): SaleCreateLineView | undefined {
    return this.lineViewMap().get(lineId);
  }

  private findStockForWarehouse(
    stocks: ProductStockByWarehouse[],
    warehouseId: number,
  ): ProductStockByWarehouse | undefined {
    return stocks.find((stock) => stock.warehouseId === warehouseId);
  }

  private hasDuplicateProduct(lineId: number, productId: number | null): boolean {
    return this.hasDuplicateProductInLines(this.lines(), lineId, productId);
  }

  private hasDuplicateProductInLines(
    lines: SaleCreateLineDraft[],
    lineId: number,
    productId: number | null,
  ): boolean {
    if (productId === null) {
      return false;
    }

    return lines.some(
      (line) => line.lineId !== lineId && line.productId === productId,
    );
  }

  private updateLineDraft(lineId: number, changes: Partial<SaleCreateLineEditDraft>): void {
    this.lineDraftsState.update((drafts) => {
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
    this.lineDraftsState.update((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[lineId];
      return nextDrafts;
    });
  }

  private resolveEffectiveLine(line: SaleCreateLineDraft): SaleCreateLineDraft {
    const draft = this.getLineDraft(line.lineId);
    if (!draft) {
      return line;
    }

    const productChanged = draft.productId !== line.productId;
    const preview = this.getLineStockPreview(line.lineId);

    return {
      ...line,
      productId: draft.productId,
      quantity: this.normalizeQuantity(this.parseDraftNumber(draft.quantity)),
      discount: this.normalizeDiscount(this.parseDraftNumber(draft.discount)),
      discountType: draft.discountType,
      ...(productChanged
        ? {
            availableStock: preview?.availableStock ?? null,
            stockLoading: preview?.stockLoading ?? false,
            stockError: preview?.stockError ?? null,
          }
        : {}),
    };
  }

  private buildLineViews(lines: SaleCreateLineDraft[]): SaleCreateLineView[] {
    return lines.map((line) => {
      const product = this.findProduct(line.productId);
      const unitPrice = product?.price ?? 0;
      const vatRate = product?.vatRate ?? 0;
      const grossAmount = unitPrice * line.quantity;
      const discountAmount = this.calculateDiscountAmount(
        grossAmount,
        line.discount,
        line.discountType,
      );
      const lineSubtotal = Math.max(grossAmount - discountAmount, 0);
      const lineTax = lineSubtotal * vatRate;

      return {
        ...line,
        productName: product?.name ?? '',
        productCode: product?.code ?? '',
        unitPrice,
        vatRate,
        grossAmount,
        discountAmount,
        lineSubtotal,
        lineTax,
        lineTotal: lineSubtotal + lineTax,
        validationError: this.validateLineAgainstLines(line, lines),
      };
    });
  }

  private ensureAtLeastOneLine(): void {
    if (!this.lines().length) {
      this.linesState.set([this.createEmptyLine()]);
    }
  }

  private createEmptyLine(): SaleCreateLineDraft {
    return {
      lineId: this.lineSequence++,
      productId: null,
      quantity: 1,
      discount: 0,
      discountType: 'percent',
      availableStock: null,
      stockLoading: false,
      stockError: null,
      validationError: null,
    };
  }

  private async loadAllActiveClients(): Promise<Client[]> {
    const pageSize = 100;
    const clients: Client[] = [];
    let page = 1;
    let total = 0;

    do {
      const params: ClientQueryParams = {
        page,
        pageSize,
        isActive: true,
      };
      const result = await firstValueFrom(this.getClientsUseCase.execute(params));
      clients.push(...result.data.filter((client) => client.isActive));
      total = result.total;
      page += 1;
    } while (clients.length < total);

    return clients;
  }

  private async loadAllActiveProducts(): Promise<Product[]> {
    const pageSize = 100;
    const products: Product[] = [];
    let page = 1;
    let total = 0;

    this.loadingProductsState.set(true);

    try {
      do {
        const params: ProductQueryParams = {
          page,
          pageSize,
          active: true,
        };
        const result = await firstValueFrom(this.getProductsUseCase.execute(params));
        products.push(...result.data.filter((product) => product.isActive));
        total = result.total;
        page += 1;
      } while (products.length < total);
    } finally {
      this.loadingProductsState.set(false);
    }

    return products;
  }

  private resolveLoadError(err: unknown): string {
    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }

    return 'No se han podido cargar los datos necesarios para crear la venta.';
  }

  private resolveSubmitError(err: unknown): string {
    if (err instanceof SaleInsufficientStockError) {
      return 'Una o varias líneas no tienen stock suficiente.';
    }

    if (err instanceof SaleClientNotActiveError) {
      return 'El cliente seleccionado está inactivo.';
    }

    if (err instanceof SaleProductNotActiveError) {
      return 'Uno o varios productos seleccionados están inactivos.';
    }

    if (err instanceof SaleInvalidDiscountError) {
      return err.message;
    }

    if (err instanceof SaleEmptyLinesError) {
      return 'Debes añadir al menos una línea antes de guardar.';
    }

    if (err instanceof SaleValidationError) {
      return err.message || 'Revisa los datos del formulario antes de guardar la venta.';
    }

    if (err instanceof SaleUnauthorizedError) {
      return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
    }

    if (err instanceof SaleForbiddenError) {
      return 'No tienes permisos para crear ventas.';
    }

    if (err instanceof SaleApiError) {
      return err.message || 'Se ha producido un error inesperado al crear la venta.';
    }

    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }

    return 'Se ha producido un error inesperado al crear la venta.';
  }
}
