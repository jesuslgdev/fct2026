import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import { SaleDetail } from '../../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class GetSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(id: number): Observable<SaleDetail> {
    return this.saleRepository.getById(id);
  }
}
