import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import { CreateSale, SaleDetail } from '../../models/sale.model';
import { SaleEmptyLinesError, SaleValidationError } from '../../models/sale-errors';

@Injectable({
  providedIn: 'root',
})
export class CreateSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(data: CreateSale): Observable<SaleDetail> {
    try {
      this.validate(data);
    } catch (error) {
      return throwError(() => error);
    }

    return this.saleRepository.create(data);
  }

  private validate(data: CreateSale): void {
    if (!data.clientId || data.clientId <= 0) {
      throw new SaleValidationError({ field: 'clientId' }, 'Client ID is required.');
    }

    if (!data.warehouseId || data.warehouseId <= 0) {
      throw new SaleValidationError({ field: 'warehouseId' }, 'Warehouse ID is required.');
    }

    if (!data.lines || data.lines.length === 0) {
      throw new SaleEmptyLinesError();
    }

    const invalidLine = data.lines.find((line) => line.productId <= 0 || line.quantity <= 0);
    if (invalidLine) {
      throw new SaleValidationError(
        { field: 'lines', productId: invalidLine.productId },
        'All lines must have a valid product and quantity greater than 0.'
      );
    }
  }
}
