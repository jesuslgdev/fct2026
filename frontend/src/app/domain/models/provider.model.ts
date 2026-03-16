import { ProviderStatus } from '../enums/provider-status.enum';
import { ProviderProduct } from './provider-product.model';

export interface Provider {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
  province?: string;
  postalCode?: string;
  contactPerson?: string;
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
  province?: string;
  postalCode?: string;
  contactPerson?: string;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  isActive?: boolean;
}
