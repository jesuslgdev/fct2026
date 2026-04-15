import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { Provider } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class GetProviderByIdUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(id: string): Promise<Provider> {
    return this.providerRepository.getProviderById(id);
  }
}
