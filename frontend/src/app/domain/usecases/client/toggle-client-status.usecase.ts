import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToggleClientStatusUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number, isActive: boolean): Observable<void> {
    return this.clientRepository.toggleClientStatus(id, isActive);
  }
}
