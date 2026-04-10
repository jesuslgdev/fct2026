import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProviderRepository } from '../../repositories/provider.repository';
import { Provider, UpdateProviderRequest } from '../../models/provider.model';
import { ProviderProduct } from '../../models/provider-product.model';
import { PageEvent } from '../../models/page-event.model';
import { ProviderStatus } from '../../enums/provider-status.enum';
import { 
  GetProvidersUseCase, 
  GetProviderByIdUseCase, 
  UpdateProviderUseCase, 
  ActivateProviderUseCase, 
  DeactivateProviderUseCase,
  GetProviderProductsUseCase
} from './index';

const MOCK_PROVIDER: Provider = {
  id: '1',
  name: 'Test Provider',
  taxId: '123456789',
  email: 'provider@test.com',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date()
};

const MOCK_PAGE_EVENT: PageEvent = {
  first: 0,
  rows: 20,
  page: 1,
  pageCount: 5
};

const MOCK_PROVIDER_PRODUCT: ProviderProduct = {
  id: 'pp-1',
  productId: 'product-1',
  productName: 'Test Product',
  providerId: '1',
  specificPrice: 12.5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

class MockProviderRepository implements ProviderRepository {
  getProviders = vi.fn().mockResolvedValue({
    data: [MOCK_PROVIDER],
    total: 1
  });
  getProviderById = vi.fn().mockResolvedValue(MOCK_PROVIDER);
  createProvider = vi.fn().mockResolvedValue(MOCK_PROVIDER);
  updateProvider = vi.fn().mockResolvedValue(MOCK_PROVIDER);
  activateProvider = vi.fn().mockResolvedValue(MOCK_PROVIDER);
  deactivateProvider = vi.fn().mockResolvedValue(MOCK_PROVIDER);
  getProviderProducts = vi.fn().mockResolvedValue([MOCK_PROVIDER_PRODUCT]);
}

describe('Provider Use Cases', () => {
  let mockRepo: MockProviderRepository;

  beforeEach(() => {
    mockRepo = new MockProviderRepository();
    TestBed.configureTestingModule({
      providers: [
        GetProvidersUseCase,
        GetProviderByIdUseCase,
        UpdateProviderUseCase,
        ActivateProviderUseCase,
        DeactivateProviderUseCase,
        GetProviderProductsUseCase,
        { provide: ProviderRepository, useValue: mockRepo },
      ],
    });
  });

  describe('GetProvidersUseCase', () => {
    it('should call getProviders and return paginated results', async () => {
      const useCase = TestBed.inject(GetProvidersUseCase) as GetProvidersUseCase;
      const result = await useCase.execute(MOCK_PAGE_EVENT);
      
      expect(mockRepo.getProviders).toHaveBeenCalledWith(MOCK_PAGE_EVENT);
      expect(mockRepo.getProviders).toHaveBeenCalledOnce();
      expect(result).toEqual({
        data: [MOCK_PROVIDER],
        total: 1
      });
    });

    it('should call getProviders without pagination params', async () => {
      const useCase = TestBed.inject(GetProvidersUseCase) as GetProvidersUseCase;
      await useCase.execute();
      
      expect(mockRepo.getProviders).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GetProviderByIdUseCase', () => {
    it('should call getProviderById and return provider', async () => {
      const useCase = TestBed.inject(GetProviderByIdUseCase) as GetProviderByIdUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.getProviderById).toHaveBeenCalledWith('1');
      expect(mockRepo.getProviderById).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_PROVIDER);
    });
  });

  describe('UpdateProviderUseCase', () => {
    it('should call updateProvider and return updated provider', async () => {
      const useCase = TestBed.inject(UpdateProviderUseCase) as UpdateProviderUseCase;
      const updateData: UpdateProviderRequest = {
        name: 'Updated Provider',
        isActive: false
      };
      const result = await useCase.execute('1', updateData);
      
      expect(mockRepo.updateProvider).toHaveBeenCalledWith('1', updateData);
      expect(mockRepo.updateProvider).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_PROVIDER);
    });
  });

  describe('ActivateProviderUseCase', () => {
    it('should call activateProvider and return provider', async () => {
      const useCase = TestBed.inject(ActivateProviderUseCase) as ActivateProviderUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.activateProvider).toHaveBeenCalledWith('1');
      expect(mockRepo.activateProvider).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_PROVIDER);
    });
  });

  describe('DeactivateProviderUseCase', () => {
    it('should call deactivateProvider and return provider', async () => {
      const useCase = TestBed.inject(DeactivateProviderUseCase) as DeactivateProviderUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.deactivateProvider).toHaveBeenCalledWith('1');
      expect(mockRepo.deactivateProvider).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_PROVIDER);
    });
  });

  describe('GetProviderProductsUseCase', () => {
    it('should call getProviderProducts and return products', async () => {
      const useCase = TestBed.inject(GetProviderProductsUseCase) as GetProviderProductsUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.getProviderProducts).toHaveBeenCalledWith('1');
      expect(mockRepo.getProviderProducts).toHaveBeenCalledOnce();
      expect(result).toEqual([MOCK_PROVIDER_PRODUCT]);
    });
  });
});
