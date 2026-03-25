import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { ClientRepository } from '@domain/repositories/client.repository';
import { ClientNotFoundError } from '@domain/models/client-errors';
import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';

const INITIAL_MOCK_CLIENTS: ClientDetail[] = [
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
  },
];

@Injectable()
export class MockClientRepository implements ClientRepository {
  private clients: ClientDetail[];

  constructor() {
    this.clients = INITIAL_MOCK_CLIENTS.map((c) => ({ ...c }));
  }

  getClients(params: ClientQueryParams): Observable<PagedResult<Client>> {
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

    return of({ data, total, page: params.page, pageSize: params.pageSize });
  }

  getClientById(id: number): Observable<ClientDetail> {
    const client = this.clients.find((c) => c.clientId === id);
    if (!client) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }
    return of({ ...client });
  }

  createClient(payload: CreateClientPayload): Observable<ClientDetail> {
    const nextId = Math.max(0, ...this.clients.map((c) => c.clientId)) + 1;
    const newClient: ClientDetail = {
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
    };
    this.clients = [...this.clients, newClient];
    return of({ ...newClient });
  }

  updateClient(id: number, payload: UpdateClientPayload): Observable<ClientDetail> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }

    const updated: ClientDetail = {
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
    };

    this.clients = this.clients.map((c) => (c.clientId === id ? updated : c));
    return of({ ...updated });
  }

  toggleClientStatus(id: number, isActive: boolean): Observable<void> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }

    this.clients = this.clients.map((c) =>
      c.clientId === id ? { ...c, isActive } : c,
    );
    return of(undefined);
  }
}
