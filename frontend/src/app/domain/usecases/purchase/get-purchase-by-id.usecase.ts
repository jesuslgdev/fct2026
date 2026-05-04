import { Injectable, inject } from '@angular/core';
import {
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetPurchaseByIdUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    purchaseId: number,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseDetail> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositivePurchaseId(purchaseId);
      return this.purchaseRepository.getPurchaseById(purchaseId);
    });
  }
}
