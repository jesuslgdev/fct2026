import { Observable } from 'rxjs';
import {
  StockDistributionFilters,
  StockDistributionListResult,
  AdjustStockPayload,
  AdjustStockResult,
} from '@domain/models/stock-distribution.model';

export abstract class StockDistributionRepository {
  abstract getStockDistribution(
    filters: StockDistributionFilters
  ): Observable<StockDistributionListResult>;

  abstract adjustStock(payload: AdjustStockPayload): Observable<AdjustStockResult>;
}
