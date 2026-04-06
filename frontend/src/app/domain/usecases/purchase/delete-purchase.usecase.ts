import { Injectable, inject } from '@angular/core';
import { PurchasePermissionContext } from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositivePurchaseId,
  assertPurchaseCanBeDeleted,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeletePurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    purchaseId: number,
    permissionContext: PurchasePermissionContext,
  ): Observable<void> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositivePurchaseId(purchaseId);

      return this.purchaseRepository.getPurchaseById(purchaseId).pipe(
        take(1),
        tap((currentPurchase) => assertPurchaseCanBeDeleted(currentPurchase.status)),
        switchMap(() => this.purchaseRepository.deletePurchase(purchaseId)),
      );
    });
  }
}
