import { describe, it, expect } from 'vitest';
import {
  transformBdcs,
  type V1Bdc,
  type V1BdcArchive,
  type V1BdcItem,
  type BdcsLookups,
} from './transform-bdcs';
import { dedupePieces } from '../dedupe-piece';
import type {
  ImportContext,
  V2ForfaitDraft,
  V2ForfaitTaskTemplateDraft,
  V2ServiceDraft,
  V2VeloDraft,
} from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_TEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const velo = (overrides: Partial<V2VeloDraft>): V2VeloDraft => ({
  id: 'velo_TEST',
  workshopId: 'workshop_TEST',
  clientId: 'client_TEST',
  marqueId: null,
  veloNumero: 0,
  status: 'RV',
  date1: null,
  date2: null,
  date3: null,
  modele: null,
  couleur: null,
  taille: null,
  numeroSerie: null,
  evalMecanoId: null,
  mecaMecanoId: null,
  ctrlMecanoId: null,
  noteVelo: null,
  notes: null,
  legacyRawV1: null,
  ...overrides,
});

const svc = (overrides: Partial<V2ServiceDraft>): V2ServiceDraft => ({
  id: 'service_TEST',
  workshopId: 'workshop_TEST',
  legacyCode: null,
  labelCanonical: '',
  categorie: null,
  categoriePrio: null,
  dureeMinutes: null,
  prix: '0',
  taxable: true,
  legacyRawV1: null,
  ...overrides,
});

const fft = (overrides: Partial<V2ForfaitDraft>): V2ForfaitDraft => ({
  id: 'forfait_TEST',
  workshopId: 'workshop_TEST',
  legacyCode: null,
  labelCanonical: '',
  prix: '0',
  dureeMinutes: null,
  taxable: true,
  legacyRawV1: null,
  ...overrides,
});

// Lookups partagés réutilisables
function buildLookups(): BdcsLookups {
  // Pieces v1 (3 réels du dump)
  const piecesV1 = [
    { pieceId: 'P00038', sku: '46-650', nom: 'KMC, Chaînes X9 vitesses, argent' },
    { pieceId: 'P00067', sku: '220069-01', nom: 'Jagwire, CEX, Gaine de frein, (5mm, noire), 50m' },
    { pieceId: 'P00549', sku: '_TEST_SKU_', nom: '_TEST_STOCK_' },
  ];
  const deduped = dedupePieces(piecesV1);

  return {
    velos: [
      velo({ id: 'velo_0123', veloNumero: 123 }),
      velo({ id: 'velo_0119', veloNumero: 119 }),
      velo({ id: 'velo_0134', veloNumero: 134 }),
      velo({ id: 'velo_0136', veloNumero: 136 }),
      velo({ id: 'velo_0137', veloNumero: 137 }),
      velo({ id: 'velo_0138', veloNumero: 138 }),
    ],
    services: [
      svc({ id: 'service_S00001_NOPE', legacyCode: 'S99999', labelCanonical: 'fake' }),
      svc({ id: 'service_S00047', legacyCode: 'S00047', labelCanonical: '🧰 Install. : chaine et lubrification', prix: '11.25' }),
      svc({ id: 'service_S00088', legacyCode: 'S00088', labelCanonical: '⛑️ Urgent. : Flat (15,5+13$ de chambre à air)', prix: '28.5' }),
    ],
    forfaits: [
      fft({ id: 'forfait_S00001', legacyCode: 'S00001', labelCanonical: '👌🏻 Forfait "BASE" - mise au point de sécurité', prix: '90' }),
    ],
    taskTemplates: [
      { id: 'ftt_1', forfaitId: 'forfait_S00001', labelCanonical: '- évaluation', position: 1 },
      { id: 'ftt_2', forfaitId: 'forfait_S00001', labelCanonical: '- ajustement freins/vitesses', position: 2 },
      { id: 'ftt_3', forfaitId: 'forfait_S00001', labelCanonical: '- lubrification', position: 3 },
    ] as V2ForfaitTaskTemplateDraft[],
    piecesMapping: deduped.mapping,
  };
}

describe('transformBdcs', () => {
  describe('cas vides', () => {
    it('aucun BDC → résultat vide', () => {
      const r = transformBdcs({ actifs: [], archives: [] }, ctx, buildLookups());
      expect(r.bdcs).toEqual([]);
      expect(r.items).toEqual([]);
      expect(r.tasks).toEqual([]);
    });
  });

  describe('BDC actif simple (BDT 0137 Walk-in : 1 service + 1 piece)', () => {
    const bdt: V1Bdc = {
      id: '0137',
      dateIn: '2026-04-29',
      veloDesc: 'Autre',
      clientNom: 'Walk-in',
      noteClient: '',
      checkEval: true,
      checkOk: true,
      checkBds: true,
      checkOut: false,
      evalStatus: 'APPROUVE',
      items: [
        {
          _row: 135,
          piece: {
            nom: 'Kenda, 700C, 30-43C, Presta 48mm',
            prix: 12.95,
            qte: 1,
            sousTotal: 12.95,
            cmd: '...',
            flag: '',
            cmdNote: '',
          },
        } as V1BdcItem,
        {
          _row: 136,
          service: {
            serviceId: 'S00088',
            nom: '⛑️ Urgent. : Flat (15,5+13$ de chambre à air)',
            fait: false,
            status: '...',
            prix: 28.5,
          },
        } as V1BdcItem,
      ],
      totalServices: 28.5,
      totalPieces: 12.95,
      remisePce: { type: 'pct', value: 100 },
      noteClientFacture: '',
    };

    it('mappe le BDC vers veloId 0137', () => {
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.bdcs).toHaveLength(1);
      expect(r.bdcs[0]).toMatchObject({
        veloId: 'velo_0137',
        evalStatus: 'APPROUVE',
        archiveStatus: 'ACTIF',
        cbEvalEnvoye: true,
        cbEval: true,
        cbBonSortie: true,
        cbArchiver: false,
        totalServices: '28.5',
        totalPieces: '12.95',
        remisePceType: 'PCT',
        remisePceValue: '100',
      });
    });

    it('crée 2 BdcItem (1 PIECE + 1 SERVICE)', () => {
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.items).toHaveLength(2);

      const piece = r.items.find((i) => i.kind === 'PIECE');
      const service = r.items.find((i) => i.kind === 'SERVICE');
      expect(piece).toBeDefined();
      expect(service).toBeDefined();

      expect(service).toMatchObject({
        kind: 'SERVICE',
        serviceId: 'service_S00088',
        forfaitId: null,
        pieceId: null,
        labelSnapshot: '⛑️ Urgent. : Flat (15,5+13$ de chambre à air)',
        unitPriceSnapshot: '28.5',
        qty: '1',
      });

      expect(piece).toMatchObject({
        kind: 'PIECE',
        labelSnapshot: 'Kenda, 700C, 30-43C, Presta 48mm',
        unitPriceSnapshot: '12.95',
        qty: '1',
        total: '12.95',
        // pieceId peut être null si la pièce n'est pas dans le mapping
      });
    });

    it('aucune BdcItemTask créée (pas de FORFAIT dans ce BDT)', () => {
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.tasks).toEqual([]);
    });
  });

  describe('BDC actif avec FORFAIT (BDT 0123 Bonelli : forfait BASE + autres items)', () => {
    const bdt: V1Bdc = {
      id: '0123',
      dateIn: '2026-04-23',
      veloDesc: 'Bonelli, Lite 1, Vert emeraude, M',
      clientNom: 'Louise Bacher',
      noteClient: '',
      checkEval: true,
      checkOk: true,
      checkBds: true,
      checkOut: false,
      evalStatus: 'APPROUVE',
      items: [
        {
          _row: 74,
          service: {
            serviceId: 'S00001',
            nom: '👌🏻 Forfait "BASE" - mise au point de sécurité',
            fait: true,
            status: '...',
            prix: 90,
          },
        } as V1BdcItem,
      ],
      totalServices: 90,
      totalPieces: 0,
      remiseSvc: { type: 'pct', value: 25 },
      noteClientFacture: '',
    };

    it('crée 1 BdcItem kind=FORFAIT lié au forfait_S00001', () => {
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.items).toHaveLength(1);
      expect(r.items[0]).toMatchObject({
        kind: 'FORFAIT',
        forfaitId: 'forfait_S00001',
        serviceId: null,
        pieceId: null,
        unitPriceSnapshot: '90',
      });
    });

    it('crée 3 BdcItemTask depuis les ForfaitTaskTemplate (TODO car BDC actif)', () => {
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.tasks).toHaveLength(3);
      expect(r.tasks.every((t) => t.status === 'TODO')).toBe(true);
      expect(r.tasks.map((t) => t.labelSnapshot).sort()).toEqual([
        '- ajustement freins/vitesses',
        '- lubrification',
        '- évaluation',
      ]);
      // toutes pointent vers le même bdcItem
      const bdcItemId = r.items[0]?.id;
      expect(r.tasks.every((t) => t.bdcItemId === bdcItemId)).toBe(true);
    });
  });

  describe('BDC archive FACTURÉ (BDT 0104 Aurélie) → tasks DONE', () => {
    const archive: V1BdcArchive = {
      id: '0104',
      dateIn: '2026-04-02\n09:32',
      dateOut: '2026-04-23',
      veloDesc: 'Picnica, Pliable, Blanc, S',
      clientNom: 'Aurélie Delimal',
      noteClient: '',
      noteClientFacture: '',
      evalStatus: '',
      checkEval: false,
      checkOk: false,
      checkBds: false,
      checkOut: true,
      items: [
        {
          _row: 3,
          service: {
            serviceId: 'S00001',
            nom: '👌🏻 Forfait "BASE" - mise au point de sécurité',
            fait: true,
            status: '...',
            prix: 90,
          },
        } as V1BdcItem,
      ],
      totalServices: 90,
      totalPieces: 0,
      archiveStatus: 'FACTURÉ',
      evalMecano: 'yako',
      mecaMecano: 'yako',
      ctrlMecano: 'yako',
      noteVelo: '',
      noteInterne: 'reçu par : yako',
    };

    it('archiveStatus FACTURÉ → ARCHIVE_FACTURE', () => {
      // Note: id 0104 n'est pas dans le mock velos mais on l'ajoute pour ce test
      const lookups = buildLookups();
      lookups.velos.push(velo({ id: 'velo_0104', veloNumero: 104 }));
      const r = transformBdcs({ actifs: [], archives: [archive] }, ctx, lookups);
      expect(r.bdcs).toHaveLength(1);
      expect(r.bdcs[0]?.archiveStatus).toBe('ARCHIVE_FACTURE');
    });

    it('tasks initialisées en DONE (archive facturée = travail fait)', () => {
      const lookups = buildLookups();
      lookups.velos.push(velo({ id: 'velo_0104', veloNumero: 104 }));
      const r = transformBdcs({ actifs: [], archives: [archive] }, ctx, lookups);
      expect(r.tasks).toHaveLength(3);
      expect(r.tasks.every((t) => t.status === 'DONE')).toBe(true);
    });
  });

  describe('mapping archiveStatus v1 → v2', () => {
    const lookups = buildLookups();
    lookups.velos.push(velo({ id: 'velo_42', veloNumero: 42 }));

    const baseArchive: V1BdcArchive = {
      id: '0042',
      dateIn: '',
      dateOut: '',
      veloDesc: '',
      clientNom: '',
      noteClient: '',
      noteClientFacture: '',
      evalStatus: '',
      checkEval: false,
      checkOk: false,
      checkBds: false,
      checkOut: false,
      items: [],
      totalServices: 0,
      totalPieces: 0,
      archiveStatus: '',
      evalMecano: '',
      mecaMecano: '',
      ctrlMecano: '',
      noteVelo: '',
      noteInterne: '',
    };

    it.each([
      ['FACTURÉ', 'ARCHIVE_FACTURE'],
      ['FACTURER', 'ARCHIVE_A_FACTURER'],
      ['REFUSÉ', 'ARCHIVE_REFUSE'],
      ['CTRL QLTÉ', 'ARCHIVE_CTRL_QLTE'],
      ['ÉVAL.', 'ARCHIVE_EVAL'],
      ['ARCHIVÉ', 'ARCHIVE_LEGACY'],
    ])('"%s" → %s', (input, expected) => {
      const r = transformBdcs(
        { actifs: [], archives: [{ ...baseArchive, archiveStatus: input }] },
        ctx,
        lookups,
      );
      expect(r.bdcs[0]?.archiveStatus).toBe(expected);
    });
  });

  describe('mapping evalStatus v1 → v2', () => {
    const baseBdt = (evalStatus: string): V1Bdc => ({
      id: '0123',
      dateIn: '',
      veloDesc: '',
      clientNom: '',
      noteClient: '',
      checkEval: false,
      checkOk: false,
      checkBds: false,
      checkOut: false,
      evalStatus,
      items: [],
      totalServices: 0,
      totalPieces: 0,
      noteClientFacture: '',
    });

    it.each([
      ['APPROUVE', 'APPROUVE'],
      ['REDUX', 'REDUX'],
      ['ATTENTE', 'ATTENTE'],
      ['REFUSE', 'REFUSE'],
      ['', 'INDECIS'], // raw vide v1 → INDECIS (= pas encore décidé)
      ['EN_ATTENTE', 'ATTENTE'], // back-compat ancien V2 (renommé en ATTENTE)
      ['EN ATTENTE', 'ATTENTE'], // variante v1 avec espace
    ])('"%s" → %s', (input, expected) => {
      const r = transformBdcs({ actifs: [baseBdt(input)], archives: [] }, ctx, buildLookups());
      expect(r.bdcs[0]?.evalStatus).toBe(expected);
    });

    it('back-compat : raw vide && checkOk=true → APPROUVE (BDT pré-v7.0.x)', () => {
      const bdt = { ...baseBdt(''), checkOk: true };
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.bdcs[0]?.evalStatus).toBe('APPROUVE');
    });
  });

  describe('item hybride (BDT 0105 Brompton : service + piece sur même row)', () => {
    const archive: V1BdcArchive = {
      id: '0105',
      dateIn: '2026-04-01',
      dateOut: '2026-04-07',
      veloDesc: 'Brompton, A line, Blanc, ...',
      clientNom: 'Nancy Wait',
      noteClient: '',
      noteClientFacture: '',
      evalStatus: '',
      checkEval: false,
      checkOk: false,
      checkBds: false,
      checkOut: true,
      items: [
        {
          _row: 3,
          service: {
            nom: '👌🏻 Forfait "Base" - MISE AU POINT DE SÉCURITÉ',
            fait: true,
            status: '...',
            prix: 90,
          },
          piece: {
            nom: 'Brompton, réflecteur avant (stock 0)',
            prix: 10,
            cmd: '@',
            qte: 1,
            sousTotal: 10,
            flag: '',
            cmdNote: '',
          },
        } as V1BdcItem,
      ],
      totalServices: 101,
      totalPieces: 100,
      archiveStatus: 'FACTURÉ',
      evalMecano: 'François',
      mecaMecano: 'François',
      ctrlMecano: 'Attente MÉCANIQUE',
      noteVelo: '',
      noteInterne: '',
    };

    it('item hybride splitté en 2 BdcItem (1 SERVICE/FORFAIT + 1 PIECE)', () => {
      const lookups = buildLookups();
      lookups.velos.push(velo({ id: 'velo_0105', veloNumero: 105 }));
      // Forfait "Base" non exact match → fallback null. On ajoute le forfait avec le bon label.
      lookups.forfaits.push(
        fft({
          id: 'forfait_BASE_uppercase',
          legacyCode: null,
          labelCanonical: '👌🏻 Forfait "Base" - MISE AU POINT DE SÉCURITÉ',
          prix: '90',
        }),
      );

      const r = transformBdcs({ actifs: [], archives: [archive] }, ctx, lookups);
      expect(r.items).toHaveLength(2);
      const kinds = r.items.map((i) => i.kind).sort();
      expect(kinds).toEqual(['FORFAIT', 'PIECE']);
    });
  });

  describe('skip si velo introuvable', () => {
    it('BDT id 9999 (pas de velo) → skip', () => {
      const bdt: V1Bdc = {
        id: '9999',
        dateIn: '',
        veloDesc: '',
        clientNom: '',
        noteClient: '',
        checkEval: false,
        checkOk: false,
        checkBds: false,
        checkOut: false,
        evalStatus: '',
        items: [],
        totalServices: 0,
        totalPieces: 0,
        noteClientFacture: '',
      };
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.bdcs).toEqual([]);
      expect(r.skipped).toHaveLength(1);
      expect(r.skipped[0]?.reason).toContain('velo');
    });
  });

  describe('remise pct/fixed mapping', () => {
    it('remiseSvc { type:"pct", value:25 } → PCT 25', () => {
      const bdt: V1Bdc = {
        id: '0119',
        dateIn: '',
        veloDesc: '',
        clientNom: '',
        noteClient: '',
        checkEval: false,
        checkOk: false,
        checkBds: false,
        checkOut: false,
        evalStatus: '',
        items: [],
        totalServices: 0,
        totalPieces: 0,
        remiseSvc: { type: 'pct', value: 25 },
        noteClientFacture: '',
      };
      const r = transformBdcs({ actifs: [bdt], archives: [] }, ctx, buildLookups());
      expect(r.bdcs[0]).toMatchObject({
        remiseSvcType: 'PCT',
        remiseSvcValue: '25',
        remisePceType: null,
        remisePceValue: null,
      });
    });
  });
});
