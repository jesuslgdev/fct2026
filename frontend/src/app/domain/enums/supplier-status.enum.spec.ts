import { describe, it, expect } from 'vitest';
import { SupplierStatus } from './supplier-status.enum';

describe('SupplierStatus', () => {
  it('should have correct values', () => {
    expect(SupplierStatus.ACTIVE).toBe('active');
    expect(SupplierStatus.INACTIVE).toBe('inactive');
  });

  it('should have only two values', () => {
    const values = Object.values(SupplierStatus);
    expect(values).toHaveLength(2);
    expect(values).toContain('active');
    expect(values).toContain('inactive');
  });
});

