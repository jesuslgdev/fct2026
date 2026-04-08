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
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2023-11-15T13:45:00Z'),
    updatedAt: new Date('2024-02-14T10:30:00Z'),
  },
  {
    id: '6',
    name: 'EcoMaterials Co',
    taxId: '654321987',
    email: 'hello@ecomaterials.com',
    phone: '+34 900 111 222',
    address: 'Green District, Palma',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-02T09:00:00Z'),
    updatedAt: new Date('2024-04-02T09:00:00Z'),
  },
  {
    id: '7',
    name: 'Office Essentials S.L.',
    taxId: '159753486',
    email: 'contact@officeessentials.es',
    phone: '+34 900 333 444',
    address: 'Plaza Central, Bilbao',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-04T15:30:00Z'),
    updatedAt: new Date('2024-04-04T15:30:00Z'),
  },
  {
    id: '8',
    name: 'CleanTech Solutions',
    taxId: '258147369',
    email: 'info@cleantech.com',
    phone: '+34 900 555 666',
    address: 'R&D Park, Malaga',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2024-01-10T08:45:00Z'),
    updatedAt: new Date('2024-03-01T12:00:00Z'),
  },
  {
    id: '9',
    name: 'LogiTrack Systems',
    taxId: '951753852',
    email: 'support@logitrack.com',
    phone: '+34 900 777 888',
    address: 'Port Zone, Valencia',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-02-01T10:00:00Z'),
    updatedAt: new Date('2024-02-01T10:00:00Z'),
  },
  {
    id: '10',
    name: 'SmartFactory Supplies',
    taxId: '753159486',
    email: 'sales@smartfactory.com',
    phone: '+34 900 999 000',
    address: 'Manufacturing Hub, Murcia',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-03-10T09:15:00Z'),
    updatedAt: new Date('2024-03-10T09:15:00Z'),
  },
  {
    id: '11',
    name: 'SecureNet Networks',
    taxId: '147258369',
    email: 'security@securenet.com',
    phone: '+34 900 222 333',
    address: 'Tech Valley, Santander',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2024-02-25T14:00:00Z'),
    updatedAt: new Date('2024-03-20T11:30:00Z'),
  },
  {
    id: '12',
    name: 'BatteryWorks',
    taxId: '369258147',
    email: 'info@batteryworks.com',
    phone: '+34 900 444 555',
    address: 'Energy District, Alicante',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-10T10:00:00Z'),
    updatedAt: new Date('2024-04-10T10:00:00Z'),
  },
  {
    id: '13',
    name: 'Precision Tools SA',
    taxId: '852741963',
    email: 'sales@precisiontools.es',
    phone: '+34 900 666 777',
    address: 'Tooling Street, Zaragoza',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-01-18T09:30:00Z'),
    updatedAt: new Date('2024-01-18T09:30:00Z'),
  },
  {
    id: '14',
    name: 'Agile Logistics',
    taxId: '654987321',
    email: 'contact@agilelogistics.com',
    phone: '+34 900 888 999',
    address: 'Logistics Avenue, Sevilla',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2023-12-05T11:00:00Z'),
    updatedAt: new Date('2024-02-20T10:20:00Z'),
  },
  {
    id: '15',
    name: 'GreenEnergy Suppliers',
    taxId: '321789654',
    email: 'green@energy.com',
    phone: '+34 900 101 202',
    address: 'Solar Avenue, Córdoba',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-03-05T12:00:00Z'),
    updatedAt: new Date('2024-03-05T12:00:00Z'),
  },
  {
    id: '16',
    name: 'AutoParts Distribución',
    taxId: '789456123',
    email: 'ventas@autoparts.com',
    phone: '+34 900 303 404',
    address: 'Auto Park, Vigo',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-12T14:20:00Z'),
    updatedAt: new Date('2024-04-12T14:20:00Z'),
  },
  {
    id: '17',
    name: 'PharmaSupply',
    taxId: '963852741',
    email: 'contact@pharmasupply.com',
    phone: '+34 900 505 606',
    address: 'Health Park, Granada',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2024-01-22T08:15:00Z'),
    updatedAt: new Date('2024-03-15T09:50:00Z'),
  },
  {
    id: '18',
    name: 'DesignPro Studio',
    taxId: '147369258',
    email: 'hello@designpro.com',
    phone: '+34 900 707 808',
    address: 'Creative District, Donostia',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-02-28T10:40:00Z'),
    updatedAt: new Date('2024-02-28T10:40:00Z'),
  },
  {
    id: '19',
    name: 'FoodIngredients SA',
    taxId: '258369147',
    email: 'info@foodingredients.com',
    phone: '+34 900 909 010',
    address: 'Food Park, Murcia',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-03-18T11:45:00Z'),
    updatedAt: new Date('2024-03-18T11:45:00Z'),
  },
  {
    id: '20',
    name: 'QualityPack Packaging',
    taxId: '369147258',
    email: 'sales@qualitypack.com',
    phone: '+34 900 111 333',
    address: 'Packaging Lane, Alicante',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-01T13:00:00Z'),
    updatedAt: new Date('2024-04-01T13:00:00Z'),
  },
  {
    id: '21',
    name: 'DataCore Analytics',
    taxId: '741852963',
    email: 'contact@datacore.com',
    phone: '+34 900 212 314',
    address: 'Analytics Campus, León',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-08T14:10:00Z'),
    updatedAt: new Date('2024-04-08T14:10:00Z'),
  },
  {
    id: '22',
    name: 'MetalWorks Factory',
    taxId: '852963741',
    email: 'info@metalworks.com',
    phone: '+34 900 414 516',
    address: 'Factory Zone, Bilbao',
    isActive: false,
    status: ProviderStatus.INACTIVE,
    createdAt: new Date('2024-01-05T08:00:00Z'),
    updatedAt: new Date('2024-03-01T09:00:00Z'),
  },
  {
    id: '23',
    name: 'ClearWater Systems',
    taxId: '963741852',
    email: 'support@clearwater.com',
    phone: '+34 900 616 718',
    address: 'Water Park, Granada',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-02-12T10:30:00Z'),
    updatedAt: new Date('2024-02-12T10:30:00Z'),
  },
  {
    id: '24',
    name: 'SmartOffice Systems',
    taxId: '741369852',
    email: 'hello@smartooffice.com',
    phone: '+34 900 818 920',
    address: 'Business Center, Palma',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-03-22T13:30:00Z'),
    updatedAt: new Date('2024-03-22T13:30:00Z'),
  },
  {
    id: '25',
    name: 'UrbanTech Innovators',
    taxId: '159486273',
    email: 'contact@urbantech.com',
    phone: '+34 900 232 425',
    address: 'Innovation Boulevard, Madrid',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date('2024-04-14T15:00:00Z'),
    updatedAt: new Date('2024-04-14T15:00:00Z'),
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

    const normalizedQuery = pageEvent?.query?.trim().toLowerCase();
    if (normalizedQuery) {
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(normalizedQuery) ||
          provider.email.toLowerCase().includes(normalizedQuery) ||
          provider.taxId.toLowerCase().includes(normalizedQuery),
      );
    }

    if (pageEvent?.status) {
      filtered = filtered.filter((provider) => provider.status === pageEvent.status);
    }
    if (pageEvent?.isActive !== undefined) {
      filtered = filtered.filter((provider) => provider.isActive === pageEvent.isActive);
    }

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

