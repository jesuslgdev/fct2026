import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, UpdateClientPayload } from '@domain/models/client.model';
import { ClientNotFoundError, ClientForbiddenError } from '@domain/models/client-errors';

@Injectable({
  providedIn: 'root',
})
export class UpdateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  async execute(id: number, payload: UpdateClientPayload): Promise<Client> {
    if (!this.hasManageClientsPermission()) {
      throw new ClientForbiddenError('Only administrators and sales managers can update clients.');
    }

    try {
      return await this.clientRepository.updateClient(id, payload);
    } catch {
      throw new ClientNotFoundError(`Client with ID ${id} not found.`);
    }
  }

  private hasManageClientsPermission(): boolean {
    return true;
  }
}
