import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleDetail, UpdateSale } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import {
  normalizeUpdateSale,
  validateSaleId,
  validateUpdateSale,
} from './sale-validation';

@Injectable({
  providedIn: 'root',
})
export class UpdateSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number, data: UpdateSale): Observable<SaleDetail> {
    try {
      validateSaleId(saleId);
      const normalizedData = normalizeUpdateSale(data);
      validateUpdateSale(normalizedData);
      return this.saleRepository.update(saleId, normalizedData);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
