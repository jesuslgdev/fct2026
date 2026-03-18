import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, CreateClientPayload } from '@domain/models/client.model';

@Injectable({
  providedIn: 'root',
})
export class CreateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(payload: CreateClientPayload): Promise<Client> {
    return this.clientRepository.createClient(payload);
  }
}
