import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import { ClientNotFoundError } from '@domain/models/client-errors';

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
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.taxId.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search),
      );
    }

    if (params.isActive !== undefined) {
      filtered = filtered.filter((c) => c.isActive === params.isActive);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize).map(c => ({
      clientId: c.clientId,
      name: c.name,
      taxId: c.taxId,
      city: c.city,
      isActive: c.isActive
    }));

    return of({
      data,
      total,
      page: params.page,
      pageSize: params.pageSize,
    }).pipe(delay(500));
  }

  getClientById(id: number): Observable<ClientDetail> {
    const client = this.clients.find((c) => c.clientId === id);
    if (!client) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }
    return of({ ...client }).pipe(delay(300));
  }

  createClient(payload: CreateClientPayload): Observable<ClientDetail> {
    const nextId = Math.max(0, ...this.clients.map((c) => c.clientId)) + 1;
    const newClient: ClientDetail = {
      ...payload,
      clientId: nextId,
      isActive: true,
    };
    this.clients = [...this.clients, newClient];
    return of({ ...newClient }).pipe(delay(400));
  }

  updateClient(id: number, payload: UpdateClientPayload): Observable<ClientDetail> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }

    const updated: ClientDetail = {
      ...this.clients[index],
      ...payload
    } as ClientDetail;

    this.clients = this.clients.map((c) => (c.clientId === id ? updated : c));
    return of({ ...updated }).pipe(delay(400));
  }

  toggleClientStatus(id: number, isActive: boolean): Observable<void> {
    const index = this.clients.findIndex((c) => c.clientId === id);
    if (index === -1) {
      return throwError(() => new ClientNotFoundError(`Client with ID ${id} not found.`));
    }

    this.clients = this.clients.map((c) =>
      c.clientId === id ? { ...c, isActive } : c,
    );
    return of(undefined).pipe(delay(300));
  }
}
