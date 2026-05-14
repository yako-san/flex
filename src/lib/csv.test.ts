import { describe, expect, it } from 'vitest';
import { toCsv, csvResponse } from './csv';

const BOM = '﻿';

describe('toCsv', () => {
  it('header + body simples', () => {
    const csv = toCsv(
      [{ a: 1, b: 'hello' }, { a: 2, b: 'world' }],
      [{ key: 'a' }, { key: 'b' }],
    );
    expect(csv).toBe(`${BOM}a,b\n1,hello\n2,world`);
  });

  it('utilise label si fourni à la place de key', () => {
    const csv = toCsv(
      [{ a: 1 }],
      [{ key: 'a', label: 'Numéro' }],
    );
    expect(csv).toBe(`${BOM}Numéro\n1`);
  });

  it('encode les valeurs avec virgule (quoted)', () => {
    const csv = toCsv(
      [{ a: 'hello, world' }],
      [{ key: 'a' }],
    );
    expect(csv).toBe(`${BOM}a\n"hello, world"`);
  });

  it('échappe les guillemets internes en doublant', () => {
    const csv = toCsv(
      [{ a: 'il a dit "salut"' }],
      [{ key: 'a' }],
    );
    expect(csv).toBe(`${BOM}a\n"il a dit ""salut"""`);
  });

  it('quote les valeurs avec retour ligne', () => {
    const csv = toCsv(
      [{ a: 'line1\nline2' }],
      [{ key: 'a' }],
    );
    expect(csv).toBe(`${BOM}a\n"line1\nline2"`);
  });

  it('anti CSV-injection : quote les valeurs commençant par =/+/-/@', () => {
    const csv = toCsv(
      [
        { a: '=SUM(A1:A10)' },
        { a: '+leading' },
        { a: '-leading' },
        { a: '@email' },
      ],
      [{ key: 'a' }],
    );
    expect(csv).toContain('"=SUM(A1:A10)"');
    expect(csv).toContain('"+leading"');
    expect(csv).toContain('"-leading"');
    expect(csv).toContain('"@email"');
  });

  it('null/undefined → chaîne vide', () => {
    const csv = toCsv(
      [{ a: null, b: undefined }] as unknown as Record<string, unknown>[],
      [{ key: 'a' }, { key: 'b' }],
    );
    expect(csv).toBe(`${BOM}a,b\n,`);
  });

  it('Date → ISO string', () => {
    const d = new Date('2026-05-14T10:00:00Z');
    const csv = toCsv([{ a: d }], [{ key: 'a' }]);
    expect(csv).toBe(`${BOM}a\n2026-05-14T10:00:00.000Z`);
  });

  it('objet → JSON stringify', () => {
    const csv = toCsv(
      [{ a: { x: 1, y: 2 } }],
      [{ key: 'a' }],
    );
    expect(csv).toContain('"{""x"":1,""y"":2}"');
  });

  it('lignes vides OK (header seul)', () => {
    const csv = toCsv([], [{ key: 'a' }, { key: 'b' }]);
    expect(csv).toBe(`${BOM}a,b\n`);
  });

  it("BOM UTF-8 en tête (accents Excel)", () => {
    const csv = toCsv([], [{ key: 'a' }]);
    expect(csv.startsWith(BOM)).toBe(true);
  });
});

describe('csvResponse', () => {
  it('Content-Type text/csv + UTF-8', () => {
    const r = csvResponse('test', 'export.csv');
    expect(r.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
  });

  it('Content-Disposition attachment avec le bon filename', () => {
    const r = csvResponse('test', 'mes-clients.csv');
    expect(r.headers.get('Content-Disposition')).toBe(
      'attachment; filename="mes-clients.csv"',
    );
  });
});
