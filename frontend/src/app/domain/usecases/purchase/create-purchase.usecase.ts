import { Injectable, inject } from '@angular/core';
import {
  CreatePurchasePayload,
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  validateCreatePurchasePayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreatePurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    payload: CreatePurchasePayload,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseDetail> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      validateCreatePurchasePayload(payload);
      return this.purchaseRepository.createPurchase(payload);
    });
  }
}
