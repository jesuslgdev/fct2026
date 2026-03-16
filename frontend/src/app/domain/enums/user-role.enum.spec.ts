import { describe, it, expect } from 'vitest';
import { UserRole } from './user-role.enum';

describe('UserRole', () => {
  it('should have correct values', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.PURCHASES_MANAGER).toBe('purchases_manager');
    expect(UserRole.USER).toBe('user');
  });

  it('should have three values', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(3);
    expect(values).toContain('admin');
    expect(values).toContain('purchases_manager');
    expect(values).toContain('user');
  });
});
