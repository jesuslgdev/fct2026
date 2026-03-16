import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { ClientNotFoundError, ClientForbiddenError } from '@domain/models/client-errors';

@Injectable({
  providedIn: 'root',
})
export class ToggleClientStatusUseCase {
  private readonly clientRepository = inject(ClientRepository);

  async execute(id: number, isActive: boolean): Promise<void> {
    if (!this.hasManageClientsPermission()) {
      throw new ClientForbiddenError('Only administrators and sales managers can change client status.');
    }

    try {
      await this.clientRepository.toggleClientStatus(id, isActive);
    } catch (error) {
      throw new ClientNotFoundError(`Client with ID ${id} not found.`);
    }
  }

  private hasManageClientsPermission(): boolean {
    return true;
  }
}
