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
