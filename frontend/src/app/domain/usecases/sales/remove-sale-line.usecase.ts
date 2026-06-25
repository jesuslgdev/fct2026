import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateSaleId, validateSaleLineId } from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class RemoveSaleLineUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number, saleLineId: number): Observable<SaleDetail> {
    try {
      validateSaleId(saleId);
      validateSaleLineId(saleLineId);
      return this.saleRepository.removeLine(saleId, saleLineId);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
