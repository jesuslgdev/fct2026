import { describe, it, expect } from 'vitest';
import { PageEvent } from './page-event.model';

describe('PageEvent', () => {
  it('should accept all optional properties', () => {
    const pageEvent: PageEvent = {};
    expect(pageEvent).toBeDefined();
  });

  it('should accept partial properties', () => {
    const pageEvent: PageEvent = {
      first: 0,
      rows: 20
    };
    expect(pageEvent.first).toBe(0);
    expect(pageEvent.rows).toBe(20);
    expect(pageEvent.page).toBeUndefined();
    expect(pageEvent.pageCount).toBeUndefined();
  });

  it('should accept all properties', () => {
    const pageEvent: PageEvent = {
      first: 20,
      rows: 20,
      page: 2,
      pageCount: 5
    };
    expect(pageEvent.first).toBe(20);
    expect(pageEvent.rows).toBe(20);
    expect(pageEvent.page).toBe(2);
    expect(pageEvent.pageCount).toBe(5);
  });
});
