import { describe, it, expect } from 'vitest';
import { ProviderStatus } from './provider-status.enum';

describe('ProviderStatus', () => {
  it('should have correct values', () => {
    expect(ProviderStatus.ACTIVE).toBe('active');
    expect(ProviderStatus.INACTIVE).toBe('inactive');
  });

  it('should have only two values', () => {
    const values = Object.values(ProviderStatus);
    expect(values).toHaveLength(2);
    expect(values).toContain('active');
    expect(values).toContain('inactive');
  });
});
