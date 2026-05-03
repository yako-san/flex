import { describe, it, expect } from 'vitest';
import { importV1, type V1Dump } from './import-v1';

const miniDump: V1Dump = {
  schemaVersion: '1.0.0',
  exportedAt: '2026-05-03T01:29:07.044Z',
  appVersion: 'v1.0.0',
  workshop: {
    id: 'yako-cyclo',
    name: 'Yako Cyclo',
    lang: 'FR',
    currency: 'CAD',
    timezone: 'America/Montreal',
  },
  counters: { veloId: 141, factureNumero: 5 },
  marques: [{ nom: 'Argon18' }, { nom: 'Trek' }, { nom: 'Sélection →' }],
  equipe: [
    {
      prenom: 'Jean-Christophe',
      nom: 'Yacono',
      surnom: 'yako',
      courriel: '[yako@example.com](mailto:yako@example.com)',
      tel: '5149953445',
      indicatif: '+1',
      lang: 'FR',
      role: 'Mécanicien',
      active: true,
      notes: '',
    },
  ],
  clients: [
    {
      prenom: 'Etienne',
      nom: 'Mayrand',
      nomComplet: 'Etienne Mayrand',
      tel: '+15142446223',
      indicatif: '+1',
      courriel: '[etienne@example.com](mailto:etienne@example.com)',
      commPref: 'Courriel,Texto',
      lead: 'yako.cyclo',
      dateIn: '2026-04-23',
      dateOut: null,
      notes: '',
      lang: 'FR',
      remise: 0,
      bdcIds: [],
      velos: [],
    },
  ],
  velos: [
    {
      id: '0121',
      status: 'APPROUVÉ',
      date1: '2026-04-23\n12:00',
      date2: null,
      date3: null,
      client: 'Etienne Mayrand',
      marque: 'Argon18',
      modele: 'Subito',
      couleur: 'kaki',
      taille: 'M',
      serie: '...',
      noteVelo: '',
      eval: 'yako',
      meca: 'Attente APPROBATION',
      ctrl: 'Attente MÉCANIQUE',
      services: '',
      pieces: '',
      notes: '',
      noteClientEval: '',
      noteClientFacture: '',
    },
  ],
  bdcs: [
    {
      id: '0121',
      dateIn: '2026-04-23',
      veloDesc: 'Argon18, Subito, kaki, M',
      clientNom: 'Etienne Mayrand',
      noteClient: '',
      checkEval: true,
      checkOk: true,
      checkBds: false,
      checkOut: false,
      evalStatus: 'APPROUVE',
      items: [
        {
          _row: 1,
          service: {
            serviceId: 'S00001',
            nom: '👌🏻 Forfait "BASE" - mise au point de sécurité',
            fait: false,
            status: '...',
            prix: 90,
          },
        },
      ],
      totalServices: 90,
      totalPieces: 0,
      noteClientFacture: '',
    },
  ],
  bdcsArchives: [],
  ventes: [
    {
      venteId: 'V1',
      date: '2026-04-28',
      client: 'Etienne Mayrand',
      cost: false,
      items: [{ pieceId: 'P00001', sku: 'SKU1', nom: 'Test Piece', qte: 1, prixUnit: 10, sousTotal: 10 }],
      _rows: [1],
      total: 10,
    },
  ],
  ventesArchives: [],
  catalogue: {
    pieces: [
      {
        flag: '@',
        groupe: '',
        nom: 'Test Piece',
        sku: 'SKU1',
        skuUrl: '',
        prixAchat: 5,
        prixBase: 5,
        prixVente: 10,
        prixCost: 5,
        prixBDC: 10,
        codeBarre: '',
        fournisseur: 'Babac',
        oos: 0,
        qteACommander: 0,
        sousTotal: 0,
        categorie: 'Test',
        stock: 5,
        stockReserve: 0,
        surplus: 0,
        notes: '',
        pieceId: 'P00001',
      },
    ],
    services: [
      {
        serviceId: 'S00001',
        label: '👌🏻 Forfait "BASE" - mise au point de sécurité',
        duree: '2:00',
        categorie: 'Forfaits',
        prix: 90,
        categoriePrio: '',
      },
      { serviceId: 'S00002', label: '- évaluation', duree: '', categorie: '', prix: 0, categoriePrio: '' },
      { serviceId: 'S00003', label: '- ajustement freins', duree: '', categorie: '', prix: 0, categoriePrio: '' },
    ],
  },
  pos: [
    {
      poNumber: 'TEST001',
      fournisseur: 'Babac',
      dateCommande: '2026-04-12',
      dateReception: '2026-04-12',
      status: 'RECU',
      items: [
        {
          nom: 'Test Piece',
          sku: 'SKU1',
          qteCommandee: 5,
          qteRecue: 5,
          prixAchat: 5,
          recu: true,
          pieceRow: 1,
          notes: '',
          pieceId: 'P00001',
          categorie: '',
        },
      ],
      _rows: [1],
    },
  ],
};

describe('importV1', () => {
  describe('orchestration sur mini dump', () => {
    it('importe toutes les entités sans skip critique', () => {
      const r = importV1(miniDump);

      expect(r.workshop).toMatchObject({
        slug: 'yako-cyclo',
        name: 'Yako Cyclo',
        country: 'CA',
        currency: 'CAD',
        timezone: 'America/Montreal',
        defaultLocale: 'fr-CA',
      });

      // 3 marques v1 mais "Sélection →" skipée
      expect(r.marques).toHaveLength(2);
      expect(r.equipe).toHaveLength(1);
      expect(r.clients).toHaveLength(1);
      expect(r.velos).toHaveLength(1);
      expect(r.forfaits).toHaveLength(1);
      expect(r.taskTemplates).toHaveLength(2); // 2 sous-tâches du forfait BASE
      expect(r.services).toHaveLength(0); // que le forfait dans ce dump
      expect(r.pieces).toHaveLength(1);
      expect(r.bdcs).toHaveLength(1);
      expect(r.bdcItems).toHaveLength(1);
      expect(r.bdcItemTasks).toHaveLength(2); // instanciées depuis taskTemplates (TODO car BDC actif)
      expect(r.ventes).toHaveLength(1);
      expect(r.pos).toHaveLength(1);
    });

    it('le BDT 0121 lié au velo 0121 par veloNumero', () => {
      const r = importV1(miniDump);
      const bdt = r.bdcs[0];
      const velo = r.velos[0];
      expect(bdt?.veloId).toBe(velo?.id);
    });

    it('BdcItemTask en TODO pour BDC actif', () => {
      const r = importV1(miniDump);
      expect(r.bdcItemTasks.every((t) => t.status === 'TODO')).toBe(true);
    });

    it('legacy mappings générés pour piece, service, forfait, velo', () => {
      const r = importV1(miniDump);
      const types = new Set(r.legacyMappings.map((m) => m.entityType));
      expect(types).toContain('piece');
      expect(types).toContain('forfait');
      expect(types).toContain('velo');
    });

    it('translations générées (marques + forfait + piece)', () => {
      const r = importV1(miniDump);
      const types = new Set(r.translations.map((t) => t.entityType));
      expect(types).toContain('MARQUE');
      expect(types).toContain('FORFAIT');
      expect(types).toContain('PIECE');
    });

    it('stats fournies', () => {
      const r = importV1(miniDump);
      expect(r.stats.marques).toBe(2);
      expect(r.stats.bdcs).toBe(1);
      expect(r.stats.skipped).toBeGreaterThan(0); // au moins "Sélection →"
    });
  });

  describe('options', () => {
    it('country/locales overridable', () => {
      const r = importV1(miniDump, {
        country: 'MX',
        defaultLocale: 'es-MX',
        activeLocales: ['es-MX', 'en-US'],
      });
      expect(r.workshop.country).toBe('MX');
      expect(r.workshop.defaultLocale).toBe('es-MX');
    });

    it('workshopId overridable', () => {
      const r = importV1(miniDump, { workshopId: 'workshop_FORCED' });
      expect(r.workshop.id).toBe('workshop_FORCED');
      expect(r.marques[0]?.workshopId).toBe('workshop_FORCED');
      expect(r.bdcs[0]?.workshopId).toBe('workshop_FORCED');
    });
  });

  describe('cohérence FK', () => {
    it('tous les bdcItems pointent vers un bdc existant', () => {
      const r = importV1(miniDump);
      const bdcIds = new Set(r.bdcs.map((b) => b.id));
      for (const item of r.bdcItems) {
        expect(bdcIds.has(item.bdcId)).toBe(true);
      }
    });

    it('tous les bdcItemTasks pointent vers un bdcItem FORFAIT existant', () => {
      const r = importV1(miniDump);
      const forfaitItemIds = new Set(
        r.bdcItems.filter((i) => i.kind === 'FORFAIT').map((i) => i.id),
      );
      for (const t of r.bdcItemTasks) {
        expect(forfaitItemIds.has(t.bdcItemId)).toBe(true);
      }
    });

    it('tous les venteItems pointent vers une vente existante', () => {
      const r = importV1(miniDump);
      const venteIds = new Set(r.ventes.map((v) => v.id));
      for (const item of r.venteItems) {
        expect(venteIds.has(item.venteId)).toBe(true);
      }
    });

    it('tous les poItems pointent vers un po existant', () => {
      const r = importV1(miniDump);
      const poIds = new Set(r.pos.map((p) => p.id));
      for (const item of r.poItems) {
        expect(poIds.has(item.poId)).toBe(true);
      }
    });
  });

  describe('cas vide', () => {
    it('dump avec aucune entité métier → résultat structuré vide', () => {
      const empty: V1Dump = {
        ...miniDump,
        marques: [],
        equipe: [],
        clients: [],
        velos: [],
        bdcs: [],
        bdcsArchives: [],
        ventes: [],
        ventesArchives: [],
        catalogue: { pieces: [], services: [] },
        pos: [],
      };
      const r = importV1(empty);
      expect(r.marques).toEqual([]);
      expect(r.equipe).toEqual([]);
      expect(r.clients).toEqual([]);
      expect(r.velos).toEqual([]);
      expect(r.bdcs).toEqual([]);
      expect(r.workshop.slug).toBe('yako-cyclo');
    });
  });
});
