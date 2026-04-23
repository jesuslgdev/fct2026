import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
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
import { CreateSale, SaleDiscountType } from '@domain/models/sale.model';
import { Warehouse } from '@domain/models/warehouse.model';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { GetProductStockByWarehousesUseCase } from '@domain/usecases/product/get-product-stock-by-warehouses.usecase';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { CreateSaleUseCase } from '@domain/usecases/sales/create-sale.usecase';
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

  private lineSequence = 1;

  readonly clients = signal<Client[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly lines = signal<SaleCreateLineDraft[]>([]);
  readonly lineStockPreviews = signal<Record<number, SaleCreateLineStockPreview>>({});

  readonly selectedClientId = signal<number | null>(null);
  readonly selectedWarehouseId = signal<number | null>(null);
  readonly selectedClientDetail = signal<ClientDetail | null>(null);

  readonly loading = signal(false);
  readonly loadingProducts = signal(false);
  readonly loadingClientDetail = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly canEditLines = computed(() =>
    this.selectedClientId() !== null && this.selectedWarehouseId() !== null,
  );

  readonly deliveryAddress = computed(() => {
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
    this.lines().map((line) => {
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
      };
    }),
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

    if (!this.selectedClientId() || !this.selectedWarehouseId() || !this.deliveryAddress()) {
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
    this.error.set(null);
    this.successMessage.set(null);
    this.ensureAtLeastOneLine();
    this.loading.set(true);

    try {
      const [clients, warehouses, products] = await Promise.all([
        this.loadAllActiveClients(),
        firstValueFrom(this.getWarehousesUseCase.execute()),
        this.loadAllActiveProducts(),
      ]);

      this.clients.set(clients);
      this.warehouses.set(warehouses);
      this.products.set(products);
    } catch (err) {
      this.error.set(this.resolveLoadError(err));
    } finally {
      this.loading.set(false);
    }
  }

  addLine(): void {
    this.lines.update((lines) => [...lines, this.createEmptyLine()]);
  }

  removeLine(lineId: number): void {
    this.lines.update((lines) => {
      const remaining = lines.filter((line) => line.lineId !== lineId);
      return remaining.length > 0 ? remaining : [this.createEmptyLine()];
    });
  }

  async onClientChange(clientId: number | null): Promise<void> {
    this.selectedClientId.set(clientId);
    this.selectedClientDetail.set(null);
    this.error.set(null);

    if (!clientId) {
      return;
    }

    this.loadingClientDetail.set(true);

    try {
      const client = await firstValueFrom(this.getClientByIdUseCase.execute(clientId));
      this.selectedClientDetail.set(client);
    } catch (err) {
      this.error.set(this.resolveLoadError(err));
    } finally {
      this.loadingClientDetail.set(false);
    }
  }

  async onWarehouseChange(warehouseId: number | null): Promise<void> {
    this.selectedWarehouseId.set(warehouseId);
    this.error.set(null);
    this.clearAllLineStockPreviews();

    if (!warehouseId) {
      this.lines.update((lines) =>
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

    this.lines.update((lines) =>
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

    this.lineStockPreviews.update((previews) => ({
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

      this.lineStockPreviews.update((previews) => ({
        ...previews,
        [lineId]: {
          availableStock: stockForWarehouse?.currentStock ?? 0,
          stockLoading: false,
          stockError: null,
        },
      }));
    } catch {
      this.lineStockPreviews.update((previews) => ({
        ...previews,
        [lineId]: {
          availableStock: null,
          stockLoading: false,
          stockError: 'No se ha podido consultar el stock del almacen seleccionado.',
        },
      }));
    }
  }

  getLineStockPreview(lineId: number): SaleCreateLineStockPreview | undefined {
    return this.lineStockPreviews()[lineId];
  }

  clearLineStockPreview(lineId: number): void {
    this.lineStockPreviews.update((previews) => {
      const nextPreviews = { ...previews };
      delete nextPreviews[lineId];
      return nextPreviews;
    });
  }

  clearAllLineStockPreviews(): void {
    this.lineStockPreviews.set({});
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.submitting.set(true);

    try {
      await firstValueFrom(this.createSaleUseCase.execute(payload));
      this.successMessage.set('La venta se ha creado correctamente.');
      await this.router.navigate(['/sales']);
    } catch (err) {
      this.error.set(this.resolveSubmitError(err));
    } finally {
      this.submitting.set(false);
    }
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

    this.lines.update((lines) =>
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

      this.lines.update((lines) =>
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
      this.lines.update((lines) =>
        lines.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                availableStock: null,
                stockLoading: false,
                stockError: 'No se ha podido consultar el stock del almacen seleccionado.',
              }
            : item,
        ),
      );
    }

    this.revalidateLine(lineId);
  }

  private revalidateLine(lineId: number): void {
    this.lines.update((lines) =>
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

    this.lines.update((lines) =>
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
    if (!line.productId) {
      return 'Selecciona un producto.';
    }

    const product = this.findProduct(line.productId);
    if (!product || !product.isActive) {
      return 'Solo se pueden seleccionar productos activos.';
    }

    if (this.hasDuplicateProduct(line.lineId, line.productId)) {
      return 'Este producto ya esta anadido en otra linea.';
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return 'La cantidad debe ser un numero entero mayor que 0.';
    }

    if (!this.selectedWarehouseId()) {
      return 'Selecciona primero un almacen para validar el stock.';
    }

    if (line.stockLoading) {
      return 'Consultando stock disponible...';
    }

    if (line.stockError) {
      return line.stockError;
    }

    if (line.availableStock === null) {
      return 'El stock aun no esta disponible para esta linea.';
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
      return 'El descuento no puede dejar el subtotal de linea en negativo.';
    }

    return null;
  }

  private buildPayload(): CreateSale | null {
    if (!this.selectedClientId()) {
      this.error.set('Selecciona un cliente antes de guardar.');
      return null;
    }

    if (!this.selectedWarehouseId()) {
      this.error.set('Selecciona un almacen antes de guardar.');
      return null;
    }

    if (!this.lines().length) {
      this.error.set('Anade al menos una linea antes de guardar.');
      return null;
    }

    const linesAreValid = this.validateAllLines();
    if (!linesAreValid) {
      this.error.set('Revisa los datos de las lineas antes de guardar la venta.');
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
      this.error.set('Anade al menos una linea valida antes de guardar.');
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
    if (productId === null) {
      return false;
    }

    return this.lines().some(
      (line) => line.lineId !== lineId && line.productId === productId,
    );
  }

  private ensureAtLeastOneLine(): void {
    if (!this.lines().length) {
      this.lines.set([this.createEmptyLine()]);
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

    this.loadingProducts.set(true);

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
      this.loadingProducts.set(false);
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
      return 'Una o varias lineas no tienen stock suficiente.';
    }

    if (err instanceof SaleClientNotActiveError) {
      return 'El cliente seleccionado esta inactivo.';
    }

    if (err instanceof SaleProductNotActiveError) {
      return 'Uno o varios productos seleccionados estan inactivos.';
    }

    if (err instanceof SaleInvalidDiscountError) {
      return err.message;
    }

    if (err instanceof SaleEmptyLinesError) {
      return 'Debes anadir al menos una linea antes de guardar.';
    }

    if (err instanceof SaleValidationError) {
      return err.message || 'Revisa los datos del formulario antes de guardar la venta.';
    }

    if (err instanceof SaleUnauthorizedError) {
      return 'Tu sesion ha expirado. Vuelve a iniciar sesion.';
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
