import { Injectable, inject } from '@angular/core';
import {
  ChangePurchaseStatusPayload,
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
  assertValidPurchaseStatusTransition,
  validateChangePurchaseStatusPayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChangePurchaseStatusUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    purchaseId: number,
    payload: ChangePurchaseStatusPayload,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseDetail> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositivePurchaseId(purchaseId);
      validateChangePurchaseStatusPayload(payload);

      return this.purchaseRepository.getPurchaseById(purchaseId).pipe(
        take(1),
        tap((currentPurchase) =>
          assertValidPurchaseStatusTransition(currentPurchase.status, payload.toStatus),
        ),
        switchMap(() => this.purchaseRepository.changePurchaseStatus(purchaseId, payload)),
      );
    });
  }
}
