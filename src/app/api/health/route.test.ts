import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it("retourne status='ok' et service='flex'", async () => {
    const res = GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('flex');
  });

  it("retourne un timestamp ISO valide", async () => {
    const res = GET();
    const body = await res.json();
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("version présente (env ou 'dev')", async () => {
    const res = GET();
    const body = await res.json();
    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });
});
