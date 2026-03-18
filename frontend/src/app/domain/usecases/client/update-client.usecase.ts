import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, UpdateClientPayload } from '@domain/models/client.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number, payload: UpdateClientPayload): Promise<Client> {
    return this.clientRepository.updateClient(id, payload);
  }
}
