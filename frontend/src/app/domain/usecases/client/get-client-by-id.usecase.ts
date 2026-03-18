import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client } from '@domain/models/client.model';

@Injectable({
  providedIn: 'root',
})
export class GetClientByIdUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number): Promise<Client> {
    return this.clientRepository.getClientById(id);
  }
}
