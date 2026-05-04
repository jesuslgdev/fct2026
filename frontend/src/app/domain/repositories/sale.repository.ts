import { Observable } from 'rxjs';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  ListSalesFilters,
  PagedResult,
  Sale,
  SaleDetail,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';

export abstract class SaleRepository {
  abstract list(filters: ListSalesFilters): Observable<PagedResult<Sale>>;
  abstract getById(id: number): Observable<SaleDetail>;
  abstract create(data: CreateSale): Observable<SaleDetail>;
  abstract update(saleId: number, data: UpdateSale): Observable<SaleDetail>;
  abstract addLine(saleId: number, data: AddSaleLine): Observable<SaleDetail>;
  abstract updateLine(
    saleId: number,
    saleLineId: number,
    data: UpdateSaleLine
  ): Observable<SaleDetail>;
  abstract removeLine(saleId: number, saleLineId: number): Observable<SaleDetail>;
  abstract advanceStatus(saleId: number, data: AdvanceSaleStatus): Observable<SaleDetail>;
}
