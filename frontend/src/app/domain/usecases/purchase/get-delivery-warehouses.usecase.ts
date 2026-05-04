import { Injectable, inject } from '@angular/core';
import {
  PurchasePermissionContext,
  PurchaseWarehouseOption,
} from '@domain/models/purchase.model';
import { assertCanManagePurchases } from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetDeliveryWarehousesUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(permissionContext: PurchasePermissionContext): Observable<PurchaseWarehouseOption[]> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      return this.purchaseRepository.getDeliveryWarehouses();
    });
  }
}
