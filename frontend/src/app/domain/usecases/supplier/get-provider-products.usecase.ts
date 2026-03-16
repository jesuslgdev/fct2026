import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { Provider } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class GetProviderProductsUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(providerId: string): Promise<Provider[]> {
    return this.providerRepository.getProviderProducts(providerId);
  }
}
