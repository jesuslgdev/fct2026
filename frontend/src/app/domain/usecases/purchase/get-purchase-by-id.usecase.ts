import { Injectable, inject } from '@angular/core';
import { PurchaseDetail } from '@domain/models/purchase.model';
import { assertPositivePurchaseId } from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetPurchaseByIdUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(purchaseId: number): Observable<PurchaseDetail> {
    return defer(() => {
      assertPositivePurchaseId(purchaseId);
      return this.purchaseRepository.getPurchaseById(purchaseId);
    });
  }
}
