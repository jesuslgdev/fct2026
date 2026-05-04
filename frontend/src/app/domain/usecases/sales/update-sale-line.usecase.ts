import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleDetail, UpdateSaleLine } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import {
  validateSaleId,
  validateSaleLineId,
  validateUpdateSaleLine,
} from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class UpdateSaleLineUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number, saleLineId: number, data: UpdateSaleLine): Observable<SaleDetail> {
    try {
      validateSaleId(saleId);
      validateSaleLineId(saleLineId);
      validateUpdateSaleLine(data);
      return this.saleRepository.updateLine(saleId, saleLineId, data);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
