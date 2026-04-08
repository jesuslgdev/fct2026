import { Observable } from 'rxjs';
import { SaleDetail, CreateSale, SaleFilters, SalePagedResult } from '../models/sale.model';

export abstract class SaleRepository {
  abstract list(filters: SaleFilters): Observable<SalePagedResult>;
  abstract getById(id: number): Observable<SaleDetail>;
  abstract create(data: CreateSale): Observable<SaleDetail>;
}
