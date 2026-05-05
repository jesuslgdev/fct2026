import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';
import {
  PurchaseDetail,
  PurchasePermissionContext,
  PurchaseStatusAuditEntry,
  PurchaseStatusTransitionEffect,
} from '@domain/models/purchase.model';
import {
  PurchaseApiError,
  PurchaseForbiddenError,
  PurchaseNotFoundError,
  PurchaseUnauthorizedError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import { GetPurchaseByIdUseCase } from '@domain/usecases/purchase/get-purchase-by-id.usecase';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PurchaseDetailStore {
  private readonly authService = inject(AuthService);
  private readonly getPurchaseByIdUseCase = inject(GetPurchaseByIdUseCase);

  private readonly purchaseState = signal<PurchaseDetail | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly purchase = this.purchaseState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly subtotal = computed(() => this.purchase()?.subtotal ?? 0);
  readonly vatTotal = computed(() => this.purchase()?.vatTotal ?? 0);
  readonly total = computed(() => this.purchase()?.total ?? 0);
  readonly statusHistory = computed<PurchaseStatusAuditEntry[]>(() => this.purchase()?.statusHistory ?? []);

  setInvalidRouteError(): void {
    this.purchaseState.set(null);
    this.errorState.set('El identificador de compra no es valido.');
  }

  async load(purchaseId: number): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const purchase = await firstValueFrom(
        this.getPurchaseByIdUseCase.execute(purchaseId, this.buildPermissionContext()),
      );
      this.purchaseState.set(purchase);
    } catch (err) {
      this.purchaseState.set(null);
      this.errorState.set(this.resolveLoadError(err));
    } finally {
      this.loadingState.set(false);
    }
  }

  getStatusLabel(status: PurchaseStatus | null): string {
    if (!status) {
      return '-';
    }

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

  getEffectLabel(effect: PurchaseStatusTransitionEffect): string {
    switch (effect) {
      case 'freeze_lines':
        return 'Bloqueo de lineas';
      case 'generate_stock_entry':
        return 'Entrada de stock';
      case 'final_state':
        return 'Estado final';
      case 'none':
      default:
        return 'Sin efecto';
    }
  }

  private buildPermissionContext(): PurchasePermissionContext {
    const user = this.authService.user();
    const purchasesDepartmentId = this.authService.hasPermission(UserPermission.PurchasesDepartment)
      ? (user?.departmentId ?? -1)
      : -1;

    return {
      role: user?.role,
      departmentId: user?.departmentId ?? null,
      purchasesDepartmentId,
      permissions: user?.permissions ?? [],
    };
  }

  private resolveLoadError(err: unknown): string {
    if (err instanceof PurchaseValidationError) {
      return err.message || 'No se pudo validar la compra solicitada.';
    }

    if (err instanceof PurchaseNotFoundError) {
      return 'No se encontro la compra solicitada.';
    }

    if (err instanceof PurchaseUnauthorizedError) {
      return 'Tu sesion ha expirado. Vuelve a iniciar sesion.';
    }

    if (err instanceof PurchaseForbiddenError) {
      return 'No tienes permisos para consultar esta compra.';
    }

    if (err instanceof PurchaseApiError) {
      return err.message || 'No se pudo cargar la compra.';
    }

    return 'No se pudo cargar la compra.';
  }
}
