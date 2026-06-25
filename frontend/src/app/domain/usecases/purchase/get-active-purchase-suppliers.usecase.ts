import { Injectable, inject } from '@angular/core';
import {
  PurchasePermissionContext,
  PurchaseSupplierOption,
} from '@domain/models/purchase.model';
import { assertCanManagePurchases } from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetActivePurchaseSuppliersUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(permissionContext: PurchasePermissionContext): Observable<PurchaseSupplierOption[]> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      return this.purchaseRepository.getActiveSuppliers();
    });
  }
}
