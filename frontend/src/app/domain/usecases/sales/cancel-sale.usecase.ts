import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleInvalidStatusTransitionError,
  SaleNotCancellableError,
} from '@domain/models/sale-errors';
import { SaleDetail, SaleSummary } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { validateSaleId } from './sale-validation';

type CancellableSale = Pick<SaleSummary | SaleDetail, 'saleId' | 'allowedTransitions'>;

@Injectable({
  providedIn: 'root',
})
export class CancelSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(sale: CancellableSale): Observable<SaleDetail> {
    try {
      validateSaleId(sale.saleId);

      if (!sale.allowedTransitions.includes(SaleStatus.CANCELLED)) {
        throw new SaleNotCancellableError();
      }

      return this.saleRepository.cancel(sale.saleId).pipe(
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof SaleInvalidStatusTransitionError
              ? new SaleNotCancellableError()
              : error
          )
        )
      );
    } catch (error) {
      return throwError(() => error);
    }
  }
}
