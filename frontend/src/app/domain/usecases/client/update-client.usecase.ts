import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { ClientDetail, UpdateClientPayload } from '@domain/models/client.model';
import { ClientInvalidPhoneError } from '@domain/models/client-errors';
import { Observable, throwError } from 'rxjs';

const PHONE_PATTERN = /^\d{9}$/;

@Injectable({
  providedIn: 'root',
})
export class UpdateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number, payload: UpdateClientPayload): Observable<ClientDetail> {
    const normalizedPayload: UpdateClientPayload = {
      ...payload,
      ...(payload.email !== undefined && payload.email !== null && {
        email: payload.email.trim().toLowerCase(),
      }),
    };

    if (
      normalizedPayload.phone !== undefined &&
      normalizedPayload.phone !== null &&
      !PHONE_PATTERN.test(normalizedPayload.phone)
    ) {
      return throwError(() => new ClientInvalidPhoneError());
    }

    return this.clientRepository.updateClient(id, normalizedPayload);
  }
}
