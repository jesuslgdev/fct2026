import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import { Observable } from 'rxjs';

export abstract class ClientRepository {
  abstract getClients(params: ClientQueryParams): Observable<PagedResult<Client>>;
  abstract getClientById(id: number): Observable<Client>;
  abstract createClient(payload: CreateClientPayload): Observable<Client>;
  abstract updateClient(id: number, payload: UpdateClientPayload): Observable<Client>;
  abstract toggleClientStatus(id: number, isActive: boolean): Observable<void>;
}
