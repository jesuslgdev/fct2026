import {
  CancelPurchasePayload,
  ChangePurchaseStatusPayload,
  CreatePurchasePayload,
  PagedResult,
  PurchaseDetail,
  PurchaseQueryParams,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseSummary,
  PurchaseWarehouseOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { Observable } from 'rxjs';

export abstract class PurchaseRepository {
  abstract getPurchases(
    params: PurchaseQueryParams,
  ): Observable<PagedResult<PurchaseSummary>>;

  abstract getPurchaseById(purchaseId: number): Observable<PurchaseDetail>;

  abstract createPurchase(payload: CreatePurchasePayload): Observable<PurchaseDetail>;

  abstract updatePurchase(
    purchaseId: number,
    payload: UpdatePurchasePayload,
  ): Observable<PurchaseDetail>;

  abstract cancelPurchase(
    purchaseId: number,
    payload: CancelPurchasePayload,
  ): Observable<PurchaseDetail>;

  abstract deletePurchase(purchaseId: number): Observable<void>;

  abstract changePurchaseStatus(
    purchaseId: number,
    payload: ChangePurchaseStatusPayload,
  ): Observable<PurchaseDetail>;

  abstract getActiveSuppliers(): Observable<PurchaseSupplierOption[]>;

  abstract getDeliveryWarehouses(): Observable<PurchaseWarehouseOption[]>;

  abstract getSupplierProducts(
    supplierId: number,
  ): Observable<PurchaseSupplierProductOption[]>;
}
