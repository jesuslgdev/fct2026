import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { Provider, UpdateProviderRequest } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class UpdateProviderUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(id: string, provider: UpdateProviderRequest): Promise<Provider> {
    return this.providerRepository.updateProvider(id, provider);
  }
}
