import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AdvanceSaleStatus, SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateAdvanceStatus, validateSaleId } from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class AdvanceSaleStatusUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number, data: AdvanceSaleStatus): Observable<SaleDetail> {
    try {
      validateSaleId(saleId);
      validateAdvanceStatus(data.newStatus);
      return this.saleRepository.advanceStatus(saleId, data);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
