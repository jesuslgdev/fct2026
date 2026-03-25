import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client, UpdateClientPayload } from '@domain/models/client.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateClientUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number, payload: UpdateClientPayload): Observable<Client> {
    return this.clientRepository.updateClient(id, payload);
  }
}
