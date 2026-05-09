import { describe, it, expect } from 'vitest';
import { transformVelos, type V1Velo } from './transform-velos';
import type {
  ImportContext,
  V2ClientDraft,
  V2EquipeMemberDraft,
  V2MarqueDraft,
} from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_TEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const mkClient = (overrides: Partial<V2ClientDraft>): V2ClientDraft => ({
  id: 'client_TEST',
  workshopId: 'workshop_TEST',
  prenom: '',
  nom: '',
  telephone: null,
  indicatif: '+1',
  courriel: null,
  commPref: 'AUCUN',
  lang: 'fr-CA',
  lead: null,
  remiseDefault: null,
  adressePostale: null,
  notes: null,
  legacyRawV1: null,
  ...overrides,
});

const mkEquipe = (overrides: Partial<V2EquipeMemberDraft>): V2EquipeMemberDraft => ({
  id: 'eq_TEST',
  workshopId: 'workshop_TEST',
  prenom: '',
  nom: '',
  surnom: '',
  courriel: null,
  telephone: null,
  indicatif: '+1',
  lang: 'fr-CA',
  role: null,
  active: true,
  notes: null,
  legacyRawV1: null,
  ...overrides,
});

const mkMarque = (overrides: Partial<V2MarqueDraft>): V2MarqueDraft => ({
  id: 'marque_TEST',
  workshopId: 'workshop_TEST',
  nom: '',
  legacyRawV1: null,
  ...overrides,
});

const fixtures = {
  clients: [
    mkClient({ id: 'client_maxime', prenom: 'Maxime', nom: 'Roy' }),
    mkClient({ id: 'client_juliette', prenom: 'Juliette', nom: 'Bibasse' }),
    mkClient({ id: 'client_etienne', prenom: 'Etienne', nom: 'Mayrand' }),
    mkClient({ id: 'client_walkin', prenom: 'Walk-in', nom: '' }),
  ],
  marques: [
    mkMarque({ id: 'marque_argon18', nom: 'Argon18' }),
    mkMarque({ id: 'marque_giant', nom: 'Giant' }),
    mkMarque({ id: 'marque_autre', nom: 'Autre' }),
    mkMarque({ id: 'marque_velomane', nom: 'Vélomane' }),
  ],
  equipe: [
    mkEquipe({ id: 'eq_yako', prenom: 'Jean-Christophe', nom: 'Yacono', surnom: 'yako' }),
    mkEquipe({ id: 'eq_paco', prenom: 'François', nom: 'Comeau', surnom: 'Paco' }),
  ],
};

const v = (overrides: Partial<V1Velo> = {}): V1Velo => ({
  id: '0100',
  status: 'RV',
  date1: null,
  date2: null,
  date3: null,
  client: 'Maxime Roy',
  marque: 'Argon18',
  modele: '',
  couleur: '',
  taille: '',
  serie: '',
  noteVelo: '',
  eval: '',
  meca: '',
  ctrl: '',
  services: '',
  pieces: '',
  notes: '',
  noteClientEval: '',
  noteClientFacture: '',
  ...overrides,
});

describe('transformVelos', () => {
  describe('cas vide', () => {
    it('liste vide → vide', () => {
      const r = transformVelos([], ctx, fixtures);
      expect(r.records).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('cas réel : vélo 0138 (Maxime Roy, RV)', () => {
    it('mapping complet', () => {
      const r = transformVelos(
        [
          v({
            id: '0138',
            status: 'RV',
            date1: '2026-05-04\n12 h 00',
            client: 'Maxime Roy',
            marque: 'Sélection →',
            modele: '...',
            couleur: '...',
            taille: '...',
            serie: '...',
            eval: 'Sélection →',
            meca: 'Attente APPROBATION',
            ctrl: 'Attente MÉCANIQUE',
          }),
        ],
        ctx,
        fixtures,
      );
      expect(r.records).toHaveLength(1);
      expect(r.records[0]).toMatchObject({
        veloNumero: 138,
        status: 'RV',
        clientId: 'client_maxime',
        marqueId: null, // "Sélection →" → null
        date1: '2026-05-04',
        date2: null,
        date3: null,
        modele: null, // "..." → null
        couleur: null,
        taille: null,
        numeroSerie: null,
        evalMecanoId: null, // "Sélection →" → null
        mecaMecanoId: null,
        ctrlMecanoId: null,
      });
      expect(r.records[0]?.id).toMatch(/^velo_[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });

  describe('cas réel : vélo 0119 ON BENCH avec mecano "yako"', () => {
    it('eval=meca="yako" → résolus en eq_yako', () => {
      const r = transformVelos(
        [
          v({
            id: '0119',
            status: 'ON BENCH',
            date1: '2026-04-22',
            client: 'Etienne Mayrand', // (placeholder, in fixtures)
            marque: 'Argon18',
            modele: 'Subito',
            couleur: 'Kaki',
            taille: 'XXS',
            serie: '360BXXS00017TL',
            eval: 'yako',
            meca: 'yako',
            ctrl: 'Attente MÉCANIQUE',
            noteVelo: 'NOTE TEST vélo',
            noteClientEval: 'NOTE TEST ÉVAL',
            noteClientFacture: 'NOTE TEST FACTURE',
          }),
        ],
        ctx,
        fixtures,
      );
      expect(r.records[0]).toMatchObject({
        veloNumero: 119,
        status: 'ON_BENCH',
        marqueId: 'marque_argon18',
        modele: 'Subito',
        couleur: 'Kaki',
        taille: 'XXS',
        numeroSerie: '360BXXS00017TL',
        evalMecanoId: 'eq_yako',
        mecaMecanoId: 'eq_yako',
        ctrlMecanoId: null,
        noteVelo: 'NOTE TEST vélo',
        // noteClientEval/Facture ne sont plus sur Velo (Sprint 2.10) —
        // déplacés sur Bdc, voir transform-bdcs.test.ts.
      });
    });
  });

  describe('mapping status v1 → v2', () => {
    it.each([
      ['RV', 'RV'],
      ['REÇU', 'RECU'],
      ['EN ATTENTE', 'EN_ATTENTE'],
      ['EVAL', 'EVAL'],
      ['ÉVAL', 'EVAL'],
      ['APPROUVÉ', 'APPROUVE'],
      ['ON BENCH', 'ON_BENCH'],
      ['CTRL QLTÉ', 'CTRL_QLTE'],
      ['FINI', 'FINI'],
      ['LIVRÉ', 'LIVRE'],
      ['FACTURER', 'FACTURER'],
      ['FACTURÉ', 'FACTURE'],
    ])('"%s" → "%s"', (input, expected) => {
      const r = transformVelos([v({ status: input })], ctx, fixtures);
      expect(r.records[0]?.status).toBe(expected);
    });

    it('status inconnu → skip', () => {
      const r = transformVelos([v({ status: 'XYZ' })], ctx, fixtures);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
      expect(r.skipped[0]?.reason).toContain('status');
    });
  });

  describe('parsing veloNumero', () => {
    it('"0138" → 138', () => {
      const r = transformVelos([v({ id: '0138' })], ctx, fixtures);
      expect(r.records[0]?.veloNumero).toBe(138);
    });

    it('"0007" → 7', () => {
      const r = transformVelos([v({ id: '0007' })], ctx, fixtures);
      expect(r.records[0]?.veloNumero).toBe(7);
    });

    it('id non numérique → skip', () => {
      const r = transformVelos([v({ id: 'XYZ' })], ctx, fixtures);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });
  });

  describe('résolution client', () => {
    it('client trouvé par "prenom nom"', () => {
      const r = transformVelos([v({ client: 'Juliette Bibasse' })], ctx, fixtures);
      expect(r.records[0]?.clientId).toBe('client_juliette');
    });

    it('client case-insensitive ("juliette bibasse" → Juliette)', () => {
      const r = transformVelos([v({ client: 'juliette bibasse' })], ctx, fixtures);
      expect(r.records[0]?.clientId).toBe('client_juliette');
    });

    it('client Walk-in (nom vide) → match sur prenom seul', () => {
      const r = transformVelos([v({ client: 'Walk-in' })], ctx, fixtures);
      expect(r.records[0]?.clientId).toBe('client_walkin');
    });

    it('client non trouvé → skip', () => {
      const r = transformVelos([v({ client: 'Inconnu Person' })], ctx, fixtures);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
      expect(r.skipped[0]?.reason).toContain('client');
    });
  });

  describe('résolution marque', () => {
    it('"Vélomane" trouvée (avec accent)', () => {
      const r = transformVelos([v({ marque: 'Vélomane' })], ctx, fixtures);
      expect(r.records[0]?.marqueId).toBe('marque_velomane');
    });

    it('"Sélection →" → null', () => {
      const r = transformVelos([v({ marque: 'Sélection →' })], ctx, fixtures);
      expect(r.records[0]?.marqueId).toBeNull();
    });

    it('marque non trouvée → null + warning loggé', () => {
      const r = transformVelos([v({ marque: 'MarqueInconnue' })], ctx, fixtures);
      expect(r.records[0]?.marqueId).toBeNull();
    });

    it('marque vide → null', () => {
      const r = transformVelos([v({ marque: '' })], ctx, fixtures);
      expect(r.records[0]?.marqueId).toBeNull();
    });
  });

  describe('parsing dates', () => {
    it('date avec heure embarquée → ISO seul', () => {
      const r = transformVelos([v({ date1: '2026-04-25\n13 h 30' })], ctx, fixtures);
      expect(r.records[0]?.date1).toBe('2026-04-25');
    });

    it('date null → null', () => {
      const r = transformVelos([v({ date1: null, date2: null, date3: null })], ctx, fixtures);
      expect(r.records[0]?.date1).toBeNull();
      expect(r.records[0]?.date2).toBeNull();
      expect(r.records[0]?.date3).toBeNull();
    });
  });

  describe('valeurs nullable', () => {
    it('modele/couleur/taille/serie "..." → null', () => {
      const r = transformVelos(
        [v({ modele: '...', couleur: '...', taille: '...', serie: '...' })],
        ctx,
        fixtures,
      );
      expect(r.records[0]?.modele).toBeNull();
      expect(r.records[0]?.couleur).toBeNull();
      expect(r.records[0]?.taille).toBeNull();
      expect(r.records[0]?.numeroSerie).toBeNull();
    });

    it('notes vide → null', () => {
      const r = transformVelos([v({ notes: '' })], ctx, fixtures);
      expect(r.records[0]?.notes).toBeNull();
    });
  });
});
