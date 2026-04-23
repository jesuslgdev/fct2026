import { Injectable } from '@angular/core';
import { SupplierRepository } from '@domain/repositories/supplier.repository';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierImportExecutionResult,
  SupplierImportTemplate,
} from '@domain/models/supplier.model';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'TechSupply S.A.',
    taxId: '123456789',
    email: 'contacto@techsupply.com',
    phone: '+34 900 123 456',
    address: 'Calle Innovación 123, Madrid',
    isActive: true,
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.INACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
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
    status: SupplierStatus.ACTIVE,
    createdAt: new Date('2024-04-14T15:00:00Z'),
    updatedAt: new Date('2024-04-14T15:00:00Z'),
  },
];

const SEED_SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Laptop Pro 15"',
    supplierId: '1',
    specificPrice: 1299.99,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    productId: '2',
    productName: 'Wireless Mouse',
    supplierId: '1',
    specificPrice: 29.99,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '3',
    productId: '1',
    productName: 'Laptop Pro 15"',
    supplierId: '2',
    specificPrice: 1249.99,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-02-20T14:30:00Z'),
  },
  {
    id: '4',
    productId: '3',
    productName: 'USB-C Hub',
    supplierId: '2',
    specificPrice: 49.99,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-02-20T14:30:00Z'),
  },
];

@Injectable()
export class MockSupplierRepository implements SupplierRepository {
  private suppliers = structuredClone(SEED_SUPPLIERS);
  private supplierProducts = structuredClone(SEED_SUPPLIER_PRODUCTS);

  async getSuppliers(pageEvent?: PageEvent): Promise<{
    data: Supplier[];
    total: number;
  }> {
    let filtered = [...this.suppliers];

    const normalizedQuery = pageEvent?.query?.trim().toLowerCase();
    if (normalizedQuery) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(normalizedQuery) ||
          supplier.email.toLowerCase().includes(normalizedQuery) ||
          supplier.taxId.toLowerCase().includes(normalizedQuery),
      );
    }

    if (pageEvent?.status) {
      filtered = filtered.filter((supplier) => supplier.status === pageEvent.status);
    }
    if (pageEvent?.isActive !== undefined) {
      filtered = filtered.filter((supplier) => supplier.isActive === pageEvent.isActive);
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

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = this.suppliers.find((p) => p.id === id);
    if (!supplier) throw new Error(`Supplier with id "${id}" not found`);
    return { ...supplier };
  }

  async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    const nextId = (Math.max(0, ...this.suppliers.map((p) => parseInt(p.id))) + 1).toString();
    const newSupplier: Supplier = {
      id: nextId,
      name: supplier.name,
      taxId: supplier.taxId,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      province: supplier.province,
      postalCode: supplier.postalCode,
      isActive: true,
      status: SupplierStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.suppliers = [...this.suppliers, newSupplier];
    return { ...newSupplier };
  }

  async updateSupplier(id: string, supplier: UpdateSupplierRequest): Promise<Supplier> {
    const index = this.suppliers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Supplier with id "${id}" not found`);

    const updated: Supplier = {
      ...this.suppliers[index],
      ...(supplier.name !== undefined && { name: supplier.name }),
      ...(supplier.taxId !== undefined && { taxId: supplier.taxId }),
      ...(supplier.email !== undefined && { email: supplier.email }),
      ...(supplier.phone !== undefined && { phone: supplier.phone }),
      ...(supplier.address !== undefined && { address: supplier.address }),
      ...(supplier.city !== undefined && { city: supplier.city }),
      ...(supplier.province !== undefined && { province: supplier.province }),
      ...(supplier.postalCode !== undefined && { postalCode: supplier.postalCode }),
      ...(supplier.isActive !== undefined && {
        isActive: supplier.isActive,
        status: supplier.isActive ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE,
      }),
      updatedAt: new Date(),
    };

    this.suppliers = this.suppliers.map((p) => (p.id === id ? updated : p));
    return { ...updated };
  }

  async activateSupplier(id: string): Promise<Supplier> {
    const index = this.suppliers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Supplier with id "${id}" not found`);

    const activated: Supplier = {
      ...this.suppliers[index],
      isActive: true,
      status: SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    };

    this.suppliers = this.suppliers.map((p) => (p.id === id ? activated : p));
    return { ...activated };
  }

  async deactivateSupplier(id: string): Promise<Supplier> {
    const index = this.suppliers.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Supplier with id "${id}" not found`);

    const deactivated: Supplier = {
      ...this.suppliers[index],
      isActive: false,
      status: SupplierStatus.INACTIVE,
      updatedAt: new Date(),
    };

    this.suppliers = this.suppliers.map((p) => (p.id === id ? deactivated : p));
    return { ...deactivated };
  }

  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    // TODO: replace with ProductRepository when Products feature becomes available
    const products = this.supplierProducts.filter((pp) => pp.supplierId === supplierId);

    return products.map((product) => ({ ...product }));
  }

  async downloadImportTemplate(): Promise<SupplierImportTemplate> {
    const headers = [
      'Nombre',
      'CIF',
      'Dirección',
      'Ciudad',
      'Provincia',
      'Código postal',
      'Teléfono',
      'Email',
    ];
    const sample = [
      'Empresa Ejemplo SL',
      'B12345678',
      'Calle Principal 123',
      'Madrid',
      'Madrid',
      '28001',
      '912345678',
      'contacto@empresa.com',
    ];

    const csv = `${headers.join(',')}\n${sample.join(',')}`;
    return {
      filename: 'plantilla_proveedores.xlsx',
      data: new TextEncoder().encode(csv).buffer,
    };
  }

  async importSuppliers(file: File): Promise<SupplierImportExecutionResult> {
    const content = await file.text();
    const rows = content.split('\n').filter((line) => line.trim().length > 0);
    const importedCount = Math.max(0, rows.length - 1);

    return {
      success: true,
      importedCount,
      message: `Se han importado ${importedCount} proveedores correctamente`,
    };
  }
}


