import { Injectable, inject } from '@angular/core';
import { PurchaseWarehouseOption } from '@domain/models/purchase.model';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetDeliveryWarehousesUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(): Observable<PurchaseWarehouseOption[]> {
    return this.purchaseRepository.getDeliveryWarehouses();
  }
}
