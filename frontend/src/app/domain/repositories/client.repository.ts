import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import { Observable } from 'rxjs';

export abstract class ClientRepository {
  abstract getClients(params: ClientQueryParams): Observable<PagedResult<Client>>;
  abstract getClientById(id: number): Observable<ClientDetail>;
  abstract createClient(payload: CreateClientPayload): Observable<ClientDetail>;
  abstract updateClient(id: number, payload: UpdateClientPayload): Observable<ClientDetail>;
  abstract toggleClientStatus(id: number, isActive: boolean): Observable<void>;
}
