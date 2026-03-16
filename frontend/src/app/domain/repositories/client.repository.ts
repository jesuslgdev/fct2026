import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';

export abstract class ClientRepository {
  abstract getClients(params: ClientQueryParams): Promise<PagedResult<Client>>;
  abstract getClientById(id: number): Promise<Client>;
  abstract createClient(payload: CreateClientPayload): Promise<Client>;
  abstract updateClient(id: number, payload: UpdateClientPayload): Promise<Client>;
  abstract toggleClientStatus(id: number, isActive: boolean): Promise<void>;
}
