import { Injectable, inject } from '@angular/core';
import { PurchaseSupplierOption } from '@domain/models/purchase.model';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetActivePurchaseSuppliersUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(): Observable<PurchaseSupplierOption[]> {
    return this.purchaseRepository.getActiveSuppliers();
  }
}
