import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client } from '@domain/models/client.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetClientByIdUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number): Observable<Client> {
    return this.clientRepository.getClientById(id);
  }
}
