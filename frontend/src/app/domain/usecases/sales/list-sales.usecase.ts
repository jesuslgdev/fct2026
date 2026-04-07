import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import { Sale, SaleFilters } from '../../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class ListSalesUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(filters: SaleFilters): Observable<{ data: Sale[]; total: number }> {
    return this.saleRepository.list(filters);
  }
}
