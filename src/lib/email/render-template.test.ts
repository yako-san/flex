import { describe, expect, it } from 'vitest';
import {
  getEmailTemplates,
  nl2br,
  pickLocale,
  renderTemplate,
} from './render-template';

describe('renderTemplate', () => {
  it('substitue les placeholders {{key}}', () => {
    const r = renderTemplate('Hello {{name}}!', { name: 'Yako' });
    expect(r).toBe('Hello Yako!');
  });

  it('plusieurs placeholders', () => {
    const r = renderTemplate('{{a}} + {{b}} = {{c}}', { a: 1, b: 2, c: 3 });
    expect(r).toBe('1 + 2 = 3');
  });

  it('placeholders manquants → chaîne vide (pas littéral)', () => {
    const r = renderTemplate('Hello {{name}}!', {});
    expect(r).toBe('Hello !');
  });

  it('null/undefined → chaîne vide', () => {
    const r = renderTemplate('a={{a}} b={{b}}', { a: null, b: undefined });
    expect(r).toBe('a= b=');
  });

  it('accepte espaces autour de la clé : {{ key }}', () => {
    const r = renderTemplate('Hello {{  name  }}!', { name: 'Yako' });
    expect(r).toBe('Hello Yako!');
  });

  it('nombres convertis en string', () => {
    const r = renderTemplate('Total : {{total}} $', { total: 42.5 });
    expect(r).toBe('Total : 42.5 $');
  });

  it("ne touche pas aux non-placeholders ressemblants", () => {
    const r = renderTemplate('Voici { x } et {{x}}', { x: 'val' });
    expect(r).toBe('Voici { x } et val');
  });
});

describe('nl2br', () => {
  it('remplace \\n par <br />', () => {
    expect(nl2br('a\nb')).toBe('a<br />\nb');
  });

  it('remplace \\r\\n par <br />', () => {
    expect(nl2br('a\r\nb')).toBe('a<br />\nb');
  });

  it('chaîne sans retour ligne inchangée', () => {
    expect(nl2br('Hello')).toBe('Hello');
  });

  it('plusieurs retours ligne', () => {
    expect(nl2br('a\nb\nc')).toBe('a<br />\nb<br />\nc');
  });
});

describe('getEmailTemplates', () => {
  it('null → objet vide', () => {
    expect(getEmailTemplates(null)).toEqual({});
  });

  it('undefined → objet vide', () => {
    expect(getEmailTemplates(undefined)).toEqual({});
  });

  it("non-objet (string, number) → objet vide", () => {
    expect(getEmailTemplates('string')).toEqual({});
    expect(getEmailTemplates(42)).toEqual({});
  });

  it('objet valide → cast tel quel', () => {
    const tpls = { eval: { subject: { fr: 'Test' } } };
    expect(getEmailTemplates(tpls)).toEqual(tpls);
  });
});

describe('pickLocale', () => {
  it('locale demandée présente → la retourne', () => {
    expect(pickLocale({ fr: 'Bonjour', en: 'Hello' }, 'fr')).toBe('Bonjour');
    expect(pickLocale({ fr: 'Bonjour', en: 'Hello' }, 'en')).toBe('Hello');
  });

  it('fallback FR → EN si FR absent', () => {
    expect(pickLocale({ en: 'Hello' }, 'fr')).toBe('Hello');
  });

  it('fallback EN → FR si EN absent', () => {
    expect(pickLocale({ fr: 'Bonjour' }, 'en')).toBe('Bonjour');
  });

  it("string vide ('   ') = absent, fallback à l'autre locale", () => {
    expect(pickLocale({ fr: '   ', en: 'Hello' }, 'fr')).toBe('Hello');
  });

  it('champ undefined → empty string', () => {
    expect(pickLocale(undefined, 'fr')).toBe('');
  });

  it('aucune locale dispo (objet vide) → empty string', () => {
    expect(pickLocale({}, 'fr')).toBe('');
  });
});
