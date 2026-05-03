import { describe, it, expect } from 'vitest';
import { transformClients, type V1Client } from './transform-clients';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_01HXTEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const cl = (overrides: Partial<V1Client> = {}): V1Client => ({
  prenom: 'Jean',
  nom: 'Doe',
  nomComplet: 'Jean Doe',
  tel: '5145559999',
  indicatif: '+1',
  courriel: 'jean@example.com',
  commPref: 'Courriel,Texto',
  lead: 'yako.cyclo',
  dateIn: '2026-04-23',
  dateOut: null,
  notes: '',
  lang: 'FR',
  remise: 0,
  bdcIds: [],
  velos: [],
  ...overrides,
});

describe('transformClients', () => {
  describe('cas vides', () => {
    it('liste vide → vide', () => {
      const r = transformClients([], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('cas réels yako-cyclo', () => {
    it('Etienne Mayrand : courriel markdown + tel E.164', () => {
      const r = transformClients(
        [
          {
            prenom: 'Etienne',
            nom: 'Mayrand',
            nomComplet: 'Etienne Mayrand',
            tel: '+15142446223',
            indicatif: '+1',
            courriel: '[etienne.mayrand@gmail.com](mailto:etienne.mayrand@gmail.com)',
            commPref: 'Courriel,Texto',
            lead: 'yako.cyclo',
            dateIn: '2026-04-23',
            dateOut: null,
            notes: 'Pré-inscription Square',
            lang: 'FR',
            remise: 0,
            bdcIds: ['0121'],
            velos: [],
          },
        ],
        ctx,
      );
      expect(r.records).toHaveLength(1);
      expect(r.records[0]).toMatchObject({
        prenom: 'Etienne',
        nom: 'Mayrand',
        telephone: '+15142446223',
        indicatif: '+1',
        courriel: 'etienne.mayrand@gmail.com',
        commPref: 'EMAIL',
        lang: 'fr-CA',
        notes: 'Pré-inscription Square',
        remiseDefault: null,
      });
      expect(r.records[0]?.id).toMatch(/^client_[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it('François Comeau : tel "(514) 274-7713" → E.164', () => {
      const r = transformClients(
        [
          cl({
            prenom: 'François',
            nom: 'Comeau',
            tel: '‭(514) 274-7713‬',
            courriel: '[fcomeau07@gmail.com](mailto:fcomeau07@gmail.com)',
          }),
        ],
        ctx,
      );
      expect(r.records[0]?.telephone).toBe('+15142747713');
      expect(r.records[0]?.courriel).toBe('fcomeau07@gmail.com');
    });

    it('client virtuel Walk-in (nom vide, courriel local) → préservé', () => {
      const r = transformClients(
        [
          cl({
            prenom: 'Walk-in',
            nom: '',
            nomComplet: 'Walk-in',
            tel: '',
            courriel: 'walkin@cycloflex.local',
            commPref: '',
            lead: 'Cyclo Flex',
            notes: 'Client virtuel pour ventes comptoir',
          }),
        ],
        ctx,
      );
      expect(r.records).toHaveLength(1);
      expect(r.records[0]).toMatchObject({
        prenom: 'Walk-in',
        nom: '',
        courriel: 'walkin@cycloflex.local',
        telephone: null,
        commPref: 'AUCUN',
      });
    });

    it('Cyclo Flex (tel="à venir") → telephone null', () => {
      const r = transformClients(
        [
          cl({
            prenom: 'Cyclo',
            nom: 'Flex',
            tel: 'à venir',
            courriel: '[a@venir.ca](mailto:a@venir.ca)',
          }),
        ],
        ctx,
      );
      expect(r.records[0]?.telephone).toBeNull();
      expect(r.records[0]?.courriel).toBe('a@venir.ca');
    });

    it('Martin Pilote : remise=15% → remiseDefault="15"', () => {
      const r = transformClients(
        [cl({ prenom: 'Martin', nom: 'Pilote', remise: 15 })],
        ctx,
      );
      expect(r.records[0]?.remiseDefault).toBe('15');
    });
  });

  describe('mapping commPref', () => {
    it.each([
      ['Courriel,Texto', 'EMAIL'], // premier de la liste
      ['Courriel', 'EMAIL'],
      ['Texto', 'SMS'],
      ['Téléphone', 'TELEPHONE'],
      ['Telephone', 'TELEPHONE'], // sans accent
      ['', 'AUCUN'],
      ['Inconnu', 'AUCUN'], // valeur non reconnue
      ['Texto,Courriel', 'SMS'], // SMS d'abord
    ])('"%s" → %s', (input, expected) => {
      const r = transformClients([cl({ commPref: input })], ctx);
      expect(r.records[0]?.commPref).toBe(expected);
    });
  });

  describe('mapping lang', () => {
    it.each([
      ['FR', 'fr-CA'],
      ['EN', 'en-CA'],
      ['fr-CA', 'fr-CA'],
      ['', 'fr-CA'], // fallback default
    ])('lang="%s" → "%s"', (input, expected) => {
      const r = transformClients([cl({ lang: input })], ctx);
      expect(r.records[0]?.lang).toBe(expected);
    });
  });

  describe('valeurs nullable', () => {
    it('courriel vide → null', () => {
      const r = transformClients([cl({ courriel: '' })], ctx);
      expect(r.records[0]?.courriel).toBeNull();
    });

    it('lead "..." → null', () => {
      const r = transformClients([cl({ lead: '...' })], ctx);
      expect(r.records[0]?.lead).toBeNull();
    });

    it('notes vide → null', () => {
      const r = transformClients([cl({ notes: '' })], ctx);
      expect(r.records[0]?.notes).toBeNull();
    });

    it('remise=0 → remiseDefault=null', () => {
      const r = transformClients([cl({ remise: 0 })], ctx);
      expect(r.records[0]?.remiseDefault).toBeNull();
    });
  });

  describe('cas dégénérés à skip', () => {
    it('prenom + nom + courriel + tel tous vides → skip', () => {
      const r = transformClients(
        [cl({ prenom: '', nom: '', courriel: '', tel: '' })],
        ctx,
      );
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });

    it('seulement courriel rempli (pas de nom) → on garde (cas plausible)', () => {
      const r = transformClients(
        [cl({ prenom: '', nom: '', courriel: 'orphan@example.com' })],
        ctx,
      );
      expect(r.records).toHaveLength(1);
    });
  });

  describe('whitespace + invisibles', () => {
    it('strip whitespace prenom/nom', () => {
      const r = transformClients([cl({ prenom: '  Marie  ', nom: '  Curie  ' })], ctx);
      expect(r.records[0]?.prenom).toBe('Marie');
      expect(r.records[0]?.nom).toBe('Curie');
    });
  });
});
