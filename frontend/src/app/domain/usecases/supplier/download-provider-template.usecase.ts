import { Injectable, inject } from '@angular/core';
import { ProviderRepository } from '../../repositories/provider.repository';
import { ProviderImportTemplate } from '../../models/provider.model';

@Injectable({ providedIn: 'root' })
export class DownloadProviderTemplateUseCase {
  private providerRepository = inject(ProviderRepository);

  execute(): Promise<ProviderImportTemplate> {
    return this.providerRepository.downloadImportTemplate();
  }
}
