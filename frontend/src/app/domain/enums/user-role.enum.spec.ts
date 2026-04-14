import { describe, it, expect } from 'vitest';
import { UserRole } from './user-role.enum';

describe('UserRole', () => {
  it('should have correct values', () => {
    expect(UserRole.Employee).toBe('Employee');
    expect(UserRole.Manager).toBe('Manager');
    expect(UserRole.Administrator).toBe('Administrator');
  });

  it('should have three values', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(3);
    expect(values).toContain('Employee');
    expect(values).toContain('Manager');
    expect(values).toContain('Administrator');
  });
});
