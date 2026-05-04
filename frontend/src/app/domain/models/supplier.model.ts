import { SupplierStatus } from '../enums/supplier-status.enum';
import { SupplierProduct } from './supplier-product.model';

export interface Supplier {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isActive: boolean;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
  products?: SupplierProduct[];
}

export interface CreateSupplierRequest {
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isActive?: boolean;
}

export interface SupplierImportError {
  row: number;
  reason: string;
}

export interface SupplierImportExecutionResult {
  success: boolean;
  importedCount: number;
  message: string;
  errors?: SupplierImportError[];
}

export interface SupplierImportTemplate {
  filename: string;
  data: ArrayBuffer;
}

