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
  validateLineUnitPricesAgainstSupplierCatalog,
  validateUpdatePurchasePayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take } from 'rxjs';

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
        switchMap((currentPurchase) => {
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

          if (!payload.lines) {
            return this.purchaseRepository.updatePurchase(purchaseId, payload);
          }

          const supplierIdForValidation = payload.supplierId ?? currentPurchase.supplierId;

          return this.purchaseRepository.getSupplierProducts(supplierIdForValidation).pipe(
            take(1),
            switchMap((supplierProducts) => {
              validateLineUnitPricesAgainstSupplierCatalog(payload.lines!, supplierProducts);
              return this.purchaseRepository.updatePurchase(purchaseId, payload);
            }),
          );
        }),
      );
    });
  }
}
