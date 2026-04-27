import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { Product, ProductQueryParams } from '@domain/models/product.model';
import {
  SaleApiError,
  SaleForbiddenError,
  SaleNotFoundError,
  SaleUnauthorizedError,
} from '@domain/models/sale-errors';
import { SaleDetail, SaleDiscountType } from '@domain/models/sale.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { GetSaleUseCase } from '@domain/usecases/sales/get-sale.usecase';

export interface SaleDetailLineView {
  lineId: number;
  saleLineId: number;
  productId: number;
  quantity: number;
  discount: number;
  discountType: SaleDiscountType;
  unitPrice: number;
  vatRate: number;
  productCode: string;
  productName: string;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  validationError: string | null;
}

@Injectable()
export class SaleDetailStore {
  private readonly getSaleUseCase = inject(GetSaleUseCase);
  private readonly getProductsUseCase = inject(GetProductsUseCase);

  readonly sale = signal<SaleDetail | null>(null);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly loadingCatalogs = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly lineViews = computed<SaleDetailLineView[]>(() => {
    const sale = this.sale();
    if (!sale) {
      return [];
    }

    return sale.lines.map((line) => {
      const product = this.findProduct(line.productId);

      return {
        lineId: line.saleLineId,
        saleLineId: line.saleLineId,
        productId: line.productId,
        quantity: line.quantity,
        discount: line.discount * 100,
        discountType: 'percent',
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        productCode: product?.code ?? `#${line.productId}`,
        productName: product?.name ?? `Producto ${line.productId}`,
        lineSubtotal: line.lineSubtotal,
        lineTax: line.lineTax,
        lineTotal: line.lineSubtotal + line.lineTax,
        validationError: null,
      };
    });
  });

  readonly subtotal = computed(() => this.sale()?.subtotal ?? 0);
  readonly taxes = computed(() => this.sale()?.taxes ?? 0);
  readonly total = computed(() => this.sale()?.total ?? 0);

  async load(saleId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const sale = await firstValueFrom(this.getSaleUseCase.execute(saleId));
      this.sale.set(sale);
      await this.loadProducts();
    } catch (err) {
      this.error.set(this.resolveLoadError(err));
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.PENDING:
        return 'Pendiente';
      case SaleStatus.APPROVED:
        return 'Aprobada';
      case SaleStatus.IN_PROCESS:
        return 'En proceso';
      case SaleStatus.SHIPPED:
        return 'Enviada';
      case SaleStatus.DELIVERED:
        return 'Entregada';
      case SaleStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  }

  private async loadProducts(): Promise<void> {
    this.loadingCatalogs.set(true);

    try {
      this.products.set(await this.loadAllProducts());
    } catch {
      this.error.set('No se pudieron cargar los productos de la venta.');
    } finally {
      this.loadingCatalogs.set(false);
    }
  }

  private findProduct(productId: number): Product | undefined {
    return this.products().find((product) => product.productId === productId);
  }

  private async loadAllProducts(): Promise<Product[]> {
    const pageSize = 100;
    const products: Product[] = [];
    let page = 1;
    let total = 0;

    do {
      const params: ProductQueryParams = { page, pageSize, active: true };
      const result = await firstValueFrom(this.getProductsUseCase.execute(params));
      products.push(...result.data);
      total = result.total;
      page += 1;
    } while (products.length < total);

    return products;
  }

  private resolveLoadError(err: unknown): string {
    if (err instanceof SaleNotFoundError) {
      return 'No se encontro la venta solicitada.';
    }

    if (err instanceof SaleUnauthorizedError) {
      return 'Tu sesion ha expirado. Vuelve a iniciar sesion.';
    }

    if (err instanceof SaleForbiddenError) {
      return 'No tienes permisos para consultar esta venta.';
    }

    if (err instanceof SaleApiError) {
      return err.message || 'No se pudo cargar la venta.';
    }

    return 'No se pudo cargar la venta.';
  }
}
