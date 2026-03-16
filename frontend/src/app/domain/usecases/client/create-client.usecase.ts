import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, CreateClientPayload } from '@domain/models/client.model';
import { ClientAlreadyExistsError, ClientInvalidTaxIdError } from '@domain/models/client-errors';

@Injectable({
  providedIn: 'root',
})
export class CreateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  async execute(payload: CreateClientPayload): Promise<Client> {
    if (!this.isValidSpanishTaxId(payload.taxId)) {
      throw new ClientInvalidTaxIdError(`Invalid tax ID format: ${payload.taxId}`);
    }

    try {
      return await this.clientRepository.createClient(payload);
    } catch {
      throw new ClientAlreadyExistsError(`Client with tax ID ${payload.taxId} already exists.`);
    }
  }

  private isValidSpanishTaxId(taxId: string): boolean {
    return /^[A-Z0-9]{8,10}[A-Z]$/i.test(taxId.toUpperCase());
  }
}
