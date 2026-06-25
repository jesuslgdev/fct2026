import { Injectable, inject } from '@angular/core';
import {
  CreatePurchasePayload,
  PurchaseDetail,
  PurchasePermissionContext,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  validateLineUnitPricesAgainstSupplierCatalog,
  validateCreatePurchasePayload,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable, switchMap, take, tap } from 'rxjs';

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

      return this.purchaseRepository.getSupplierProducts(payload.supplierId).pipe(
        take(1),
        tap((supplierProducts) =>
          validateLineUnitPricesAgainstSupplierCatalog(payload.lines, supplierProducts),
        ),
        switchMap(() => this.purchaseRepository.createPurchase(payload)),
      );
    });
  }
}
