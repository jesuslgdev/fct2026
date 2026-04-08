import { Injectable } from '@angular/core';
import { ProviderRepository } from '@domain/repositories/provider.repository';
import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
} from '@domain/models/provider.model';
import { ProviderProduct } from '@domain/models/provider-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { ProviderStatus } from '@domain/enums/provider-status.enum';

const SEED_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'TechSupply S.A.',
    taxId: '123456789',
    email: 'contacto@techsupply.com',
    phone: '+34 900 123 456',
    address: 'Calle Innovación 123, Madrid',
    contactPerson: 'Juan Rodríguez',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    name: 'Global Components Ltd',
    taxId: '987654321',
    email: 'info@globalcomponents.com',
    phone: '+34 900 987 654',
    address: 'Industrial Park, Barcelona',
    contactPerson: 'Maria López',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-02-20T14:30:00Z'),
  },
  {
    id: '3',
    name: 'Hardware Solutions SL',
    taxId: '456789123',
    email: 'sales@hardwaresolutions.com',
    phone: '+34 900 456 789',
    address: 'Tech Hub, Valencia',
    contactPerson: 'Carlos Martínez',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2023-12-10T09:15:00Z'),
    updatedAt: new Date('2024-01-05T16:45:00Z'),
  },
  {
    id: '4',
    name: 'Digital Services Inc',
    taxId: '789123456',
    email: 'support@digitalservices.com',
    phone: '+34 900 321 654',
    address: 'Digital Campus, Seville',
    contactPerson: 'Ana García',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-03-01T11:20:00Z'),
    updatedAt: new Date('2024-03-01T11:20:00Z'),
  },
  {
    id: '5',
    name: 'Supply Chain Partners',
    taxId: '321654987',
    email: 'operations@supplychain.com',
    phone: '+34 900 654 321',
    address: 'Logistics Center, Zaragoza',
    contactPerson: 'Luis Fernández',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2023-11-15T13:45:00Z'),
    updatedAt: new Date('2024-02-14T10:30:00Z'),
  },
];

const SEED_PROVIDER_PRODUCTS: ProviderProduct[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Laptop Pro 15"',
    providerId: '1',
    specificPrice: 1299.99,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    productId: '2',
    productName: 'Wireless Mouse',
    providerId: '1',
    specificPrice: 29.99,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '3',
    productId: '1',
    productName: 'Laptop Pro 15"',
    providerId: '2',
    specificPrice: 1249.99,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-02-20T14:30:00Z'),
  },
  {
    id: '4',
    productId: '3',
    productName: 'USB-C Hub',
    providerId: '2',
    specificPrice: 49.99,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-02-20T14:30:00Z'),
  },
];

@Injectable()
export class MockProviderRepository implements ProviderRepository {
  private providers = structuredClone(SEED_PROVIDERS);
  private providerProducts = structuredClone(SEED_PROVIDER_PRODUCTS);

  async getProviders(pageEvent?: PageEvent): Promise<{
    data: Provider[];
    total: number;
  }> {
    let filtered = [...this.providers];

    // Search filtering (simulated)
    // TODO: implement search filtering when search functionality is added

    // Client-side pagination
    const total = filtered.length;
    if (pageEvent?.first !== undefined && pageEvent?.rows !== undefined) {
      const start = pageEvent.first;
      const end = start + pageEvent.rows;
      filtered = filtered.slice(start, end);
    }

    return { data: filtered, total };
  }

  async getProviderById(id: string): Promise<Provider> {
    const provider = this.providers.find((p) => p.id === id);
    if (!provider) throw new Error(`Provider with id "${id}" not found`);
    return { ...provider };
  }

  async createProvider(provider: CreateProviderRequest): Promise<Provider> {
    const nextId = (Math.max(0, ...this.providers.map((p) => parseInt(p.id))) + 1).toString();
    const newProvider: Provider = {
      id: nextId,
      name: provider.name,
      taxId: provider.taxId,
      email: provider.email,
      phone: provider.phone,
      address: provider.address,
      contactPerson: provider.contactPerson,
      isActive: true,
      status: ProviderStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.providers = [...this.providers, newProvider];
    return { ...newProvider };
  }

  async updateProvider(id: string, provider: UpdateProviderRequest): Promise<Provider> {
    const index = this.providers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Provider with id "${id}" not found`);

    const updated: Provider = {
      ...this.providers[index],
      ...(provider.name !== undefined && { name: provider.name }),
      ...(provider.taxId !== undefined && { taxId: provider.taxId }),
      ...(provider.email !== undefined && { email: provider.email }),
      ...(provider.phone !== undefined && { phone: provider.phone }),
      ...(provider.address !== undefined && { address: provider.address }),
      ...(provider.contactPerson !== undefined && { contactPerson: provider.contactPerson }),
      ...(provider.isActive !== undefined && {
        isActive: provider.isActive,
        status: provider.isActive ? ProviderStatus.ACTIVE : ProviderStatus.INACTIVE,
      }),
      updatedAt: new Date(),
    };

    this.providers = this.providers.map((p) => (p.id === id ? updated : p));
    return { ...updated };
  }

  async activateProvider(id: string): Promise<Provider> {
    const index = this.providers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Provider with id "${id}" not found`);

    const activated: Provider = {
      ...this.providers[index],
      isActive: true,
      status: ProviderStatus.ACTIVE,
      updatedAt: new Date(),
    };

    this.providers = this.providers.map((p) => (p.id === id ? activated : p));
    return { ...activated };
  }

  async deactivateProvider(id: string): Promise<Provider> {
    const index = this.providers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Provider with id "${id}" not found`);

    const deactivated: Provider = {
      ...this.providers[index],
      isActive: false,
      status: ProviderStatus.INACTIVE,
      updatedAt: new Date(),
    };

    this.providers = this.providers.map((p) => (p.id === id ? deactivated : p));
    return { ...deactivated };
  }

  async getProviderProducts(providerId: string): Promise<Provider[]> {
    // TODO: replace with ProductRepository when Products feature becomes available
    const products = this.providerProducts.filter((pp) => pp.providerId === providerId);
    
    // For now, return the provider with products attached
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) throw new Error(`Provider with id "${providerId}" not found`);
    
    return [{ ...provider, products }];
  }
}
