import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, ClientQueryParams, PagedResult } from '@domain/models/client.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetClientsUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(params: ClientQueryParams): Observable<PagedResult<Client>> {
    return this.clientRepository.getClients(params);
  }
}
