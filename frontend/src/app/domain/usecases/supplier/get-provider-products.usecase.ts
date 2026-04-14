import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { ProviderProduct } from '../../models/provider-product.model';

@Injectable({ providedIn: 'root' })
export class GetProviderProductsUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(providerId: string): Promise<ProviderProduct[]> {
    return this.providerRepository.getProviderProducts(providerId);
  }
}
