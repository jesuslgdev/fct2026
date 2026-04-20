import { Observable } from 'rxjs';
import {
  CreateSale,
  PagedResult,
  Sale,
  SaleDetail,
  SaleFilters,
} from '../models/sale.model';

export abstract class SaleRepository {
  abstract list(filters: SaleFilters): Observable<PagedResult<Sale>>;
  abstract getById(id: number): Observable<SaleDetail>;
  abstract create(data: CreateSale): Observable<SaleDetail>;
}
