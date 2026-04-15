import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { Provider, CreateProviderRequest } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class CreateProviderUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(provider: CreateProviderRequest): Promise<Provider> {
    return this.providerRepository.createProvider(provider);
  }
}
