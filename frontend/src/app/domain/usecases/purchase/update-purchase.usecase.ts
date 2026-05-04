import { Injectable, inject } from '@angular/core';
import {
  PurchaseDetail,
  PurchasePermissionContext,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { PurchaseValidationError } from '@domain/models/purchase-errors';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
  assertPurchaseCanBeEdited,
  shouldResetLinesWhenSupplierChanges,
  validateUpdatePurchasePayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdatePurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    purchaseId: number,
    payload: UpdatePurchasePayload,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseDetail> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositivePurchaseId(purchaseId);
      validateUpdatePurchasePayload(payload);

      return this.purchaseRepository.getPurchaseById(purchaseId).pipe(
        take(1),
        tap((currentPurchase) => {
          assertPurchaseCanBeEdited(currentPurchase.status);

          const supplierWasChanged = shouldResetLinesWhenSupplierChanges(
            currentPurchase.supplierId,
            payload.supplierId,
          );

          if (supplierWasChanged && (!payload.lines || payload.lines.length === 0)) {
            throw new PurchaseValidationError(
              {
                field: 'lines',
                reason: 'supplier_changed',
                supplierId: payload.supplierId,
              },
              'When supplier changes, at least one new line must be provided.',
            );
          }
        }),
        switchMap(() => this.purchaseRepository.updatePurchase(purchaseId, payload)),
      );
    });
  }
}
