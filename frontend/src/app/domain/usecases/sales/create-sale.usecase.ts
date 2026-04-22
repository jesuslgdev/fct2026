import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CreateSale, SaleDetail } from '@domain/models/sale.model';
import { SaleRepository } from '@domain/repositories/sale.repository';
import {
  validateClientId,
  validateCreateSaleLines,
  validateWarehouseId,
} from './sale-validation';

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
    validateClientId(data.clientId);
    validateWarehouseId(data.warehouseId);
    validateCreateSaleLines(data.lines);
  }
}
