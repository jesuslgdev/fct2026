import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { PageEvent } from '../../models/page-event.model';
import { Provider } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class GetProvidersUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(pageEvent?: PageEvent): Promise<{
    data: Provider[];
    total: number;
  }> {
    return this.providerRepository.getProviders(pageEvent);
  }
}
