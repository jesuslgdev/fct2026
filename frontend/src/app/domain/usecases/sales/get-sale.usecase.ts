import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateSaleId } from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class GetSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(id: number): Observable<SaleDetail> {
    try {
      validateSaleId(id);
    } catch (error) {
      return throwError(() => error);
    }

    return this.saleRepository.getById(id);
  }
}
