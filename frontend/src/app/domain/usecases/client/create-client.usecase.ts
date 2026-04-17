import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { ClientDetail, CreateClientPayload } from '@domain/models/client.model';
import { ClientInvalidPhoneError, ClientInvalidTaxIdError } from '@domain/models/client-errors';
import { Observable, throwError } from 'rxjs';

const TAX_ID_PATTERN =
  /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$/;
const PHONE_PATTERN = /^\d{9}$/;

@Injectable({
  providedIn: 'root',
})
export class CreateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(payload: CreateClientPayload): Observable<ClientDetail> {
    const normalizedPayload: CreateClientPayload = {
      ...payload,
      taxId: payload.taxId.toUpperCase(),
      email: payload.email.trim().toLowerCase(),
    };

    if (!TAX_ID_PATTERN.test(normalizedPayload.taxId)) {
      return throwError(() => new ClientInvalidTaxIdError());
    }

    if (!PHONE_PATTERN.test(normalizedPayload.phone)) {
      return throwError(() => new ClientInvalidPhoneError());
    }

    return this.clientRepository.createClient(normalizedPayload);
  }
}
