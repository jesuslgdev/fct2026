import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, CreateClientPayload } from '@domain/models/client.model';
import { ClientInvalidTaxIdError } from '@domain/models/client-errors';

const TAX_ID_PATTERN =
  /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$/;

@Injectable({
  providedIn: 'root',
})
export class CreateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(payload: CreateClientPayload): Promise<Client> {
    const normalizedPayload: CreateClientPayload = {
      ...payload,
      taxId: payload.taxId.toUpperCase(),
    };

    if (!TAX_ID_PATTERN.test(normalizedPayload.taxId)) {
      throw new ClientInvalidTaxIdError();
    }

    return this.clientRepository.createClient(normalizedPayload);
  }
}
