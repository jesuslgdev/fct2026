import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AddSaleLine, SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateAddSaleLine, validateSaleId } from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class AddSaleLineUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number, data: AddSaleLine): Observable<SaleDetail> {
    try {
      validateSaleId(saleId);
      validateAddSaleLine(data);
      return this.saleRepository.addLine(saleId, data);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
