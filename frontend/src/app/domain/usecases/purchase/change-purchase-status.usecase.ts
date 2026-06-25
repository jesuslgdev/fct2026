import { Injectable, inject } from '@angular/core';
import {
  ChangePurchaseStatusPayload,
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
  validateChangePurchaseStatusPayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

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

      // Transition validity is enforced exclusively by backend.
      return this.purchaseRepository.changePurchaseStatus(purchaseId, payload);
    });
  }
}
