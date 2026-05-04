import { PageEvent } from '../models/page-event.model';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierImportExecutionResult,
  SupplierImportTemplate,
} from '../models/supplier.model';
import { SupplierProduct } from '../models/supplier-product.model';

export abstract class SupplierRepository {
  abstract getSuppliers(pageEvent?: PageEvent): Promise<{
    data: Supplier[];
    total: number;
  }>;
  abstract getSupplierById(id: string): Promise<Supplier>;
  abstract createSupplier(supplier: CreateSupplierRequest): Promise<Supplier>;
  abstract updateSupplier(id: string, supplier: UpdateSupplierRequest): Promise<Supplier>;
  abstract activateSupplier(id: string): Promise<Supplier>;
  abstract deactivateSupplier(id: string): Promise<Supplier>;
  abstract getSupplierProducts(supplierId: string): Promise<SupplierProduct[]>;
  abstract downloadImportTemplate(): Promise<SupplierImportTemplate>;
  abstract importSuppliers(file: File): Promise<SupplierImportExecutionResult>;
}

