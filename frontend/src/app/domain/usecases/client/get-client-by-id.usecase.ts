import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { ClientDetail } from '@domain/models/client.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetClientByIdUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number): Observable<ClientDetail> {
    return this.clientRepository.getClientById(id);
  }
}
