import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, ClientQueryParams, PagedResult } from '@domain/models/client.model';

@Injectable({
  providedIn: 'root',
})
export class GetClientsUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(params: ClientQueryParams): Promise<PagedResult<Client>> {
    return this.clientRepository.getClients(params);
  }
}
