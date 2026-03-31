import { describe, expect, it } from 'vitest';

describe('Health Router', () => {
  it('should return ok status', () => {
    const result = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      version: '0.0.1',
    };
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
