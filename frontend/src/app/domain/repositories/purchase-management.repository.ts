import {
  CreatePurchaseOrderInput,
  PaginatedResponse,
  PurchaseFilters,
  PurchaseOrder,
  UpdatePurchaseOrderInput,
} from '@domain/types/purchase.types';

/**
 * Contrato de persistencia para compras.
 * Esta interfaz no depende de framework ni librerias externas.
 */
export interface PurchaseRepository {
  list(filters: PurchaseFilters): Promise<PaginatedResponse<PurchaseOrder>>;
  getById(purchaseId: number): Promise<PurchaseOrder>;
  getLastPurchaseNumberByYear(year: number): Promise<string | null>;
  create(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
  update(purchaseId: number, input: UpdatePurchaseOrderInput): Promise<PurchaseOrder>;
  cancel(purchaseId: number): Promise<PurchaseOrder>;
}
