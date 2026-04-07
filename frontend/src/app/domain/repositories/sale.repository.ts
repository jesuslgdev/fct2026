import { Observable } from 'rxjs';
import { Sale, SaleDetail, CreateSale, SaleFilters } from '../models/sale.model';

export abstract class SaleRepository {
  abstract list(filters: SaleFilters): Observable<{ data: Sale[]; total: number }>;
  abstract getById(id: number): Observable<SaleDetail>;
  abstract create(data: CreateSale): Observable<SaleDetail>;
}
