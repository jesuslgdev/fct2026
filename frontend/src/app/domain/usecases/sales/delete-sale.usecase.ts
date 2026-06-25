import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { SaleNotDeletableError } from '@domain/models/sale-errors';
import { SaleDetail, SaleSummary } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateSaleId } from './sale-validation';

type DeletableSale = Pick<SaleSummary | SaleDetail, 'saleId' | 'status'>;

@Injectable({
  providedIn: 'root',
})
export class DeleteSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(sale: DeletableSale): Observable<void> {
    try {
      validateSaleId(sale.saleId);

      if (sale.status !== SaleStatus.PENDING) {
        throw new SaleNotDeletableError();
      }

      return this.saleRepository.delete(sale.saleId);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
