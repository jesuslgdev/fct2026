import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client } from '@domain/models/client.model';
import { ClientNotFoundError } from '@domain/models/client-errors';

@Injectable({
  providedIn: 'root',
})
export class GetClientByIdUseCase {
  private readonly clientRepository = inject(ClientRepository);

  async execute(id: number): Promise<Client> {
    try {
      return await this.clientRepository.getClientById(id);
    } catch (error) {
      throw new ClientNotFoundError(`Client with ID ${id} not found.`);
    }
  }
}
