import { PageEvent } from '../models/page-event.model';
import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderImportExecutionResult,
  ProviderImportTemplate,
} from '../models/provider.model';

export abstract class ProviderRepository {
  abstract getProviders(pageEvent?: PageEvent): Promise<{
    data: Provider[];
    total: number;
  }>;
  abstract getProviderById(id: string): Promise<Provider>;
  abstract createProvider(provider: CreateProviderRequest): Promise<Provider>;
  abstract updateProvider(id: string, provider: UpdateProviderRequest): Promise<Provider>;
  abstract activateProvider(id: string): Promise<Provider>;
  abstract deactivateProvider(id: string): Promise<Provider>;
  abstract getProviderProducts(providerId: string): Promise<Provider[]>;
  abstract downloadImportTemplate(): Promise<ProviderImportTemplate>;
  abstract importProviders(file: File): Promise<ProviderImportExecutionResult>;
}
