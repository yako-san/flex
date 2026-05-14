import { describe, expect, it } from 'vitest';
import { escapeHtml, fmt$, SHARED_STYLES } from './styles';

describe('fmt$', () => {
  it('formate avec 2 décimales et symbole $', () => {
    expect(fmt$(0)).toBe('0.00 $');
    expect(fmt$(1.5)).toBe('1.50 $');
    expect(fmt$(123.456)).toBe('123.46 $');
    expect(fmt$(1000)).toBe('1000.00 $');
  });

  it('arrondit avec toFixed (rounding half-to-even du moteur JS)', () => {
    expect(fmt$(1.005)).toMatch(/^1\.0[01] \$/); // toFixed comportement bench
    expect(fmt$(0.999)).toBe('1.00 $');
  });

  it('négatif → préserve le signe', () => {
    expect(fmt$(-12.5)).toBe('-12.50 $');
  });

  it('zero canonique', () => {
    expect(fmt$(0)).toBe('0.00 $');
  });
});

describe('escapeHtml', () => {
  it('échappe les 5 caractères critiques', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#039;');
  });

  it('ordre & en premier (sinon double-escape)', () => {
    expect(escapeHtml('&<')).toBe('&amp;&lt;');
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('texte sans caractères spéciaux inchangé', () => {
    expect(escapeHtml('Hello world 123')).toBe('Hello world 123');
  });

  it('mix complet (XSS attempt)', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
    );
  });

  it('accents préservés (pas dans les 5 critiques)', () => {
    expect(escapeHtml('café & thé')).toBe('café &amp; thé');
  });

  it('chaîne vide → chaîne vide', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('SHARED_STYLES', () => {
  it('contient @page size Letter (format Canada/US)', () => {
    expect(SHARED_STYLES).toContain('@page');
    expect(SHARED_STYLES).toContain('size: Letter');
  });

  it('font-family Inter en priorité', () => {
    expect(SHARED_STYLES).toContain("'Inter'");
  });

  it('selecteurs critiques V1 présents', () => {
    expect(SHARED_STYLES).toContain('.page');
    expect(SHARED_STYLES).toContain('.header');
    expect(SHARED_STYLES).toContain('.workshop');
    expect(SHARED_STYLES).toContain('.items');
    expect(SHARED_STYLES).toContain('.footer');
    expect(SHARED_STYLES).toContain('.totals');
    expect(SHARED_STYLES).toContain('.total-grand');
  });

  it("jaune logo signature V1 (#fcd900) — proche de --jaune CSS var", () => {
    expect(SHARED_STYLES).toContain('#fcd900');
  });

  it('tabular-nums sur les colonnes numériques (alignement totals)', () => {
    expect(SHARED_STYLES).toContain('tabular-nums');
  });
});
