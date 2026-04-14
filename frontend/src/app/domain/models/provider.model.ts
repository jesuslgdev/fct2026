import { ProviderStatus } from '../enums/provider-status.enum';
import { ProviderProduct } from './provider-product.model';

export interface Provider {
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
  status: ProviderStatus;
  createdAt: Date;
  updatedAt: Date;
  products?: ProviderProduct[];
}

export interface CreateProviderRequest {
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface UpdateProviderRequest {
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

export interface ProviderImportError {
  row: number;
  reason: string;
}

export interface ProviderImportExecutionResult {
  success: boolean;
  importedCount: number;
  message: string;
  errors?: ProviderImportError[];
}

export interface ProviderImportTemplate {
  filename: string;
  data: ArrayBuffer;
}
