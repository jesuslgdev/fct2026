import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { ProviderImportExecutionResult } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class ImportProvidersUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(file: File): Promise<ProviderImportExecutionResult> {
    return this.providerRepository.importProviders(file);
  }
}
