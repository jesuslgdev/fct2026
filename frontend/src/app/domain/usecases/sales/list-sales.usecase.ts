import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import { PagedResult, Sale, SaleFilters } from '../../models/sale.model';
import { SaleValidationError } from '../../models/sale-errors';

@Injectable({
  providedIn: 'root',
})
export class ListSalesUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(filters: SaleFilters = {}): Observable<PagedResult<Sale>> {
    try {
      const normalizedFilters = this.normalize(filters);
      this.validate(normalizedFilters);
      return this.saleRepository.list(normalizedFilters);
    } catch (error) {
      return throwError(() => error);
    }
  }

  private normalize(filters: SaleFilters): SaleFilters {
    const search = filters.search?.trim();

    return {
      ...filters,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
      sortField: filters.sortField ?? 'created_at',
      sortOrder: filters.sortOrder ?? 'desc',
      search: search || undefined,
    };
  }

  private validate(filters: SaleFilters): void {
    if (!filters.page || filters.page < 1) {
      throw new SaleValidationError({ field: 'page' }, 'Page must be greater than or equal to 1.');
    }

    if (!filters.pageSize || filters.pageSize < 1 || filters.pageSize > 100) {
      throw new SaleValidationError(
        { field: 'pageSize' },
        'Page size must be between 1 and 100.'
      );
    }

    if (filters.clientId !== undefined && filters.clientId <= 0) {
      throw new SaleValidationError(
        { field: 'clientId' },
        'Client ID must be greater than 0.'
      );
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new SaleValidationError(
        { field: 'dateRange' },
        'Date from must be earlier than or equal to date to.'
      );
    }
  }
}
