import { Observable } from 'rxjs';
import {
  CreateSale,
  ListSalesFilters,
  PagedResult,
  Sale,
  SaleDetail,
} from '../models/sale.model';

export abstract class SaleRepository {
  abstract list(filters: ListSalesFilters): Observable<PagedResult<Sale>>;
  abstract getById(id: number): Observable<SaleDetail>;
  abstract create(data: CreateSale): Observable<SaleDetail>;
}
