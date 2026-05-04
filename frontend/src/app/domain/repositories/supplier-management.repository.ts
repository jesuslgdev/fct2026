import { Supplier } from '@domain/types/purchase.types';

/**
 * Contrato de proveedores para el flujo de compras.
 */
export interface SupplierRepository {
  getActiveSuppliers(): Promise<readonly Supplier[]>;
  isSupplierActive(supplierId: number): Promise<boolean>;
}
