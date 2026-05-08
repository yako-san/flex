import { describe, it, expect } from 'vitest';
import { parseCsv, autoMapColumns } from './parse-csv';

describe('parseCsv', () => {
  it('parse un CSV simple', () => {
    const r = parseCsv('a,b,c\n1,2,3\n4,5,6');
    expect(r.headers).toEqual(['a', 'b', 'c']);
    expect(r.rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ]);
  });

  it('gère les guillemets et virgules dans valeurs', () => {
    const r = parseCsv('nom,notes\n"Doe, John","note avec, virgule"');
    expect(r.rows[0]).toEqual({ nom: 'Doe, John', notes: 'note avec, virgule' });
  });

  it('gère le BOM UTF-8', () => {
    const r = parseCsv('﻿a,b\n1,2');
    expect(r.headers).toEqual(['a', 'b']);
  });

  it('gère les guillemets échappés ""', () => {
    const r = parseCsv('a\n"il a dit ""bonjour"""');
    expect(r.rows[0]?.['a']).toBe('il a dit "bonjour"');
  });

  it('gère les retours chariot dans les valeurs entre guillemets', () => {
    const r = parseCsv('nom,notes\n"Doe","ligne 1\nligne 2"');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]?.['notes']).toBe('ligne 1\nligne 2');
  });

  it('ignore les lignes vides', () => {
    const r = parseCsv('a\n1\n\n2\n');
    expect(r.rows).toHaveLength(2);
  });
});

describe('autoMapColumns', () => {
  it('mappe les colonnes anglaises et françaises courantes', () => {
    const m = autoMapColumns(['First Name', 'Last Name', 'Email', 'Phone']);
    expect(m).toEqual({
      prenom: 'First Name',
      nom: 'Last Name',
      courriel: 'Email',
      telephone: 'Phone',
    });
  });

  it('mappe les variantes accentuées et avec underscores', () => {
    const m = autoMapColumns(['prénom', 'nom', 'téléphone', 'courriel']);
    expect(m['prenom']).toBe('prénom');
    expect(m['telephone']).toBe('téléphone');
    expect(m['courriel']).toBe('courriel');
  });

  it('renvoie objet vide si aucune correspondance', () => {
    const m = autoMapColumns(['xyz', 'abc']);
    expect(m).toEqual({});
  });
});
