import { Injectable, inject } from '@angular/core';
import {
  PagedResult,
  PurchasePermissionContext,
  PurchaseQueryParams,
  PurchaseSummary,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  normalizePurchaseQueryParams,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetPurchasesUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    params: PurchaseQueryParams,
    permissionContext: PurchasePermissionContext,
  ): Observable<PagedResult<PurchaseSummary>> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      const normalizedParams = normalizePurchaseQueryParams(params);
      return this.purchaseRepository.getPurchases(normalizedParams);
    });
  }
}
