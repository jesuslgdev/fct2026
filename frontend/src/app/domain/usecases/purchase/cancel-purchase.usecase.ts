import { Injectable, inject } from '@angular/core';
import {
  CancelPurchasePayload,
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
  assertPurchaseCanBeCancelled,
  validateCancelPurchasePayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CancelPurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    purchaseId: number,
    payload: CancelPurchasePayload,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseDetail> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositivePurchaseId(purchaseId);
      validateCancelPurchasePayload(payload);

      return this.purchaseRepository.getPurchaseById(purchaseId).pipe(
        take(1),
        tap((currentPurchase) => assertPurchaseCanBeCancelled(currentPurchase.status)),
        switchMap(() => this.purchaseRepository.cancelPurchase(purchaseId, payload)),
      );
    });
  }
}
