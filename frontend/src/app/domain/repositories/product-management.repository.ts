import { Product } from '@domain/types/purchase.types';

/**
 * Contrato de productos para compras.
 * El filtrado por proveedor debe respetar la relacion PROVEEDOR_PRODUCTO.
 */
export interface ProductRepository {
  getProductsBySupplier(supplierId: number): Promise<readonly Product[]>;
}
