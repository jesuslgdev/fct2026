import { Injectable } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';

const INITIAL_MOCK_CLIENTS: Client[] = [
  {
    clientId: 1,
    name: 'Acme Corp',
    taxId: 'B12345678',
    address: 'Calle Mayor 1',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
    phone: '600000001',
    email: 'acme@example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 2,
    name: 'Beta SL',
    taxId: 'B12345679',
    address: 'Avenida Diagonal 2',
    city: 'Barcelona',
    province: 'Barcelona',
    postalCode: '08001',
    phone: '600000002',
    email: 'beta@example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 3,
    name: 'Gamma SA',
    taxId: '12345679B',
    address: 'Plaza España 3',
    city: 'Seville',
    province: 'Sevilla',
    postalCode: '41001',
    phone: '600000003',
    email: 'gamma@example.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 4,
    name: 'Delta Ltd',
    taxId: 'B98765432',
    address: 'Calle Gran Vía 4',
    city: 'Valencia',
    province: 'Valencia',
    postalCode: '46001',
    phone: '600000004',
    email: 'delta@valencia.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 5,
    name: 'Epsilon Corp',
    taxId: 'A12345678',
    address: 'Plaza Nueva 5',
    city: 'Bilbao',
    province: 'Bizkaia',
    postalCode: '48001',
    phone: '600000005',
    email: 'epsilon@bilbao.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 6,
    name: 'Zeta Solutions',
    taxId: 'B87654321',
    address: 'Avenida de la Constitución 6',
    city: 'Sevilla',
    province: 'Sevilla',
    postalCode: '41002',
    phone: '600000006',
    email: 'zeta@sevilla.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 7,
    name: 'Eta Tech',
    taxId: 'C23456789',
    address: 'Calle Alcalá 7',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28002',
    phone: '600000007',
    email: 'eta@madrid.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 8,
    name: 'Theta Systems',
    taxId: 'D34567890',
    address: 'Paseo de Gracia 8',
    city: 'Barcelona',
    province: 'Barcelona',
    postalCode: '08002',
    phone: '600000008',
    email: 'theta@barcelona.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 9,
    name: 'Iota Digital',
    taxId: 'E45678901',
    address: 'Calle del Mar 9',
    city: 'Valencia',
    province: 'Valencia',
    postalCode: '46002',
    phone: '600000009',
    email: 'iota@valencia.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 10,
    name: 'Kappa Services',
    taxId: 'F56789012',
    address: 'Gran Vía 10',
    city: 'Bilbao',
    province: 'Bizkaia',
    postalCode: '48002',
    phone: '600000010',
    email: 'kappa@bilbao.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 11,
    name: 'Lambda Software',
    taxId: 'G67890123',
    address: 'Calle Mayor 11',
    city: 'Zaragoza',
    province: 'Zaragoza',
    postalCode: '50001',
    phone: '600000011',
    email: 'lambda@zaragoza.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 12,
    name: 'Mu Consulting',
    taxId: 'H78901234',
    address: 'Avenida del Puerto 12',
    city: 'Málaga',
    province: 'Málaga',
    postalCode: '29001',
    phone: '600000012',
    email: 'mu@malaga.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 13,
    name: 'Nu Innovations',
    taxId: 'I89012345',
    address: 'Plaza de la Luna 13',
    city: 'Murcia',
    province: 'Murcia',
    postalCode: '30001',
    phone: '600000013',
    email: 'nu@murcia.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 14,
    name: 'Xi Technologies',
    taxId: 'J90123456',
    address: 'Calle del Sol 14',
    city: 'Palma de Mallorca',
    province: 'Illes Balears',
    postalCode: '07001',
    phone: '600000014',
    email: 'xi@mallorca.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 15,
    name: 'Omicron Labs',
    taxId: 'K01234567',
    address: 'Avenida de América 15',
    city: 'Las Palmas de Gran Canaria',
    province: 'Las Palmas',
    postalCode: '35001',
    phone: '600000015',
    email: 'omicron@laspalmas.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 16,
    name: 'Pi Analytics',
    taxId: 'L12345678',
    address: 'Calle del Paseo 16',
    city: 'Alicante',
    province: 'Alicante',
    postalCode: '03001',
    phone: '600000016',
    email: 'pi@alicante.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 17,
    name: 'Rho Ventures',
    taxId: 'M23456789',
    address: 'Plaza del Ayuntamiento 17',
    city: 'Valladolid',
    province: 'Valladolid',
    postalCode: '47001',
    phone: '600000017',
    email: 'rho@valladolid.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 18,
    name: 'Sigma Group',
    taxId: 'N34567890',
    address: 'Calle de la Fuente 18',
    city: 'Vigo',
    province: 'Pontevedra',
    postalCode: '36201',
    phone: '600000018',
    email: 'sigma@vigo.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 19,
    name: 'Tau Dynamics',
    taxId: 'O45678901',
    address: 'Avenida de la Playa 19',
    city: 'Gijón',
    province: 'Asturias',
    postalCode: '33201',
    phone: '600000019',
    email: 'tau@gijon.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 20,
    name: 'Upsilon Corp',
    taxId: 'P56789012',
    address: 'Calle del Mercado 20',
    city: 'Santander',
    province: 'Cantabria',
    postalCode: '39001',
    phone: '600000020',
    email: 'upsilon@santander.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 21,
    name: 'Phi Solutions',
    taxId: 'Q67890123',
    address: 'Plaza de la Catedral 21',
    city: 'León',
    province: 'León',
    postalCode: '24001',
    phone: '600000021',
    email: 'phi@leon.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 22,
    name: 'Chi Systems',
    taxId: 'R78901234',
    address: 'Avenida de la Universidad 22',
    city: 'Granada',
    province: 'Granada',
    postalCode: '18001',
    phone: '600000022',
    email: 'chi@granada.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 23,
    name: 'Psi Technologies',
    taxId: 'S89012345',
    address: 'Calle de la Rosa 23',
    city: 'Córdoba',
    province: 'Córdoba',
    postalCode: '14001',
    phone: '600000023',
    email: 'psi@cordoba.com',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 24,
    name: 'Omega Digital',
    taxId: 'T90123456',
    address: 'Plaza de la Constitución 24',
    city: 'Almería',
    province: 'Almería',
    postalCode: '04001',
    phone: '600000024',
    email: 'omega@almeria.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    clientId: 25,
    name: 'Alpha Prime',
    taxId: 'U01234567',
    address: 'Calle del Puerto 25',
    city: 'Cádiz',
    province: 'Cádiz',
    postalCode: '11001',
    phone: '600000025',
    email: 'alpha@cadiz.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

@Injectable()
export class MockClientRepository implements ClientRepository {
  private clients: Client[];

  constructor() {
    this.clients = INITIAL_MOCK_CLIENTS.map((c) => ({ ...c }));
  }

  async getClients(params: ClientQueryParams): Promise<PagedResult<Client>> {
    let filtered = [...this.clients];

    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.taxId.toLowerCase().includes(term),
      );
    }

    if (params.isActive !== undefined) {
      filtered = filtered.filter((c) => c.isActive === params.isActive);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);

    return { data, total, page: params.page, pageSize: params.pageSize };
  }

  async getClientById(id: number): Promise<Client> {
    const client = this.clients.find((c) => c.clientId === id);
    if (!client) throw new Error(`Client with ID ${id} not found.`);
    return { ...client };
  }

  async createClient(payload: CreateClientPayload): Promise<Client> {
    const nextId = Math.max(0, ...this.clients.map((c) => c.clientId)) + 1;
    const newClient: Client = {
      clientId: nextId,
      name: payload.name,
      taxId: payload.taxId,
      address: payload.address,
      city: payload.city,
      province: payload.province,
      postalCode: payload.postalCode,
      phone: payload.phone,
      email: payload.email,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.clients = [...this.clients, newClient];
    return { ...newClient };
  }

  async updateClient(id: number, payload: UpdateClientPayload): Promise<Client> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) throw new Error(`Client with ID ${id} not found.`);

    const updated: Client = {
      ...this.clients[index],
      ...(payload.name !== undefined && {
        name: payload.name ?? this.clients[index].name,
      }),
      ...(payload.address !== undefined && {
        address: payload.address ?? this.clients[index].address,
      }),
      ...(payload.city !== undefined && {
        city: payload.city ?? this.clients[index].city,
      }),
      ...(payload.province !== undefined && {
        province: payload.province ?? this.clients[index].province,
      }),
      ...(payload.postalCode !== undefined && {
        postalCode: payload.postalCode ?? this.clients[index].postalCode,
      }),
      ...(payload.phone !== undefined && {
        phone: payload.phone ?? this.clients[index].phone,
      }),
      ...(payload.email !== undefined && {
        email: payload.email ?? this.clients[index].email,
      }),
      updatedAt: new Date().toISOString(),
    };

    this.clients = this.clients.map((c) => (c.clientId === id ? updated : c));
    return { ...updated };
  }

  async toggleClientStatus(id: number, isActive: boolean): Promise<void> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) throw new Error(`Client with ID ${id} not found.`);

    this.clients = this.clients.map((c) =>
      c.clientId === id ? { ...c, isActive } : c,
    );
  }
}
