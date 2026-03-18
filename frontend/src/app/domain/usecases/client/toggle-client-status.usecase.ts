import { Injectable, inject } from '@angular/core';
import { ClientRepository } from '@domain/repositories/client.repository';

@Injectable({
  providedIn: 'root',
})
export class ToggleClientStatusUseCase {
  private readonly clientRepository = inject(ClientRepository);

  execute(id: number, isActive: boolean): Promise<void> {
    return this.clientRepository.toggleClientStatus(id, isActive);
  }
}
