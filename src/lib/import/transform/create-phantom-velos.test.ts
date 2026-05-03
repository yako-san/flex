import { describe, it, expect } from 'vitest';
import { createPhantomVelosForOrphanedBdcs } from './create-phantom-velos';
import type {
  ImportContext,
  V2ClientDraft,
  V2EquipeMemberDraft,
  V2MarqueDraft,
  V2VeloDraft,
} from './types';
import type { V1Bdc, V1BdcArchive } from './transform-bdcs';

const ctx: ImportContext = {
  workshopId: 'workshop_test',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const client = (overrides: Partial<V2ClientDraft>): V2ClientDraft => ({
  id: 'client_1',
  workshopId: 'workshop_test',
  prenom: 'Marie',
  nom: 'Dupont',
  telephone: null,
  indicatif: null,
  courriel: null,
  commPref: 'EMAIL',
  lang: 'fr-CA',
  lead: null,
  remiseDefault: null,
  adressePostale: null,
  notes: null,
  ...overrides,
});

const marque = (overrides: Partial<V2MarqueDraft>): V2MarqueDraft => ({
  id: 'marque_brompton',
  workshopId: 'workshop_test',
  nom: 'brompton',
  ...overrides,
});

const equipeMember = (overrides: Partial<V2EquipeMemberDraft>): V2EquipeMemberDraft => ({
  id: 'eq_yako',
  workshopId: 'workshop_test',
  prenom: 'JC',
  nom: 'Yacono',
  surnom: 'yako',
  courriel: null,
  telephone: null,
  indicatif: null,
  lang: 'fr-CA',
  role: 'Mécanicien',
  active: true,
  notes: null,
  ...overrides,
});

const archive = (overrides: Partial<V1BdcArchive>): V1BdcArchive => ({
  id: '0102',
  dateIn: '2026-04-13',
  dateOut: '2026-04-24',
  veloDesc: 'Specialized, Custom Rats, noir, L',
  clientNom: 'Marie Dupont',
  noteClient: '',
  checkEval: false,
  checkOk: false,
  checkBds: false,
  checkOut: true,
  evalStatus: '',
  items: [],
  totalServices: 0,
  totalPieces: 0,
  noteClientFacture: '',
  archiveStatus: 'FACTURÉ',
  evalMecano: 'yako',
  mecaMecano: 'yako',
  ctrlMecano: 'yako',
  noteVelo: '',
  noteInterne: 'note interne',
  ...overrides,
});

const actif = (overrides: Partial<V1Bdc>): V1Bdc => ({
  id: '0106',
  dateIn: '2026-04-02',
  veloDesc: 'Autre, Inconnu, Noir, M',
  clientNom: 'Marie Dupont',
  noteClient: '',
  checkEval: false,
  checkOk: false,
  checkBds: false,
  checkOut: false,
  evalStatus: 'APPROUVE',
  items: [],
  totalServices: 0,
  totalPieces: 0,
  noteClientFacture: '',
  ...overrides,
});

describe('createPhantomVelosForOrphanedBdcs', () => {
  it('crée un phantom pour un BDC archivé sans vélo correspondant', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({})] },
      [], // aucun vélo existant
      ctx,
      { clients: [client({})], marques: [], equipe: [equipeMember({})] },
    );

    expect(result.phantoms).toHaveLength(1);
    const ph = result.phantoms[0]!;
    expect(ph.veloNumero).toBe(102);
    expect(ph.clientId).toBe('client_1');
    expect(ph.modele).toBe('Custom Rats');
    expect(ph.couleur).toBe('noir');
    expect(ph.taille).toBe('L');
    expect(ph.status).toBe('FACTURE');
    expect(ph.evalMecanoId).toBe('eq_yako');
    expect(ph.notes).toBe('note interne');
  });

  it('résout la marque depuis le veloDesc', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({ veloDesc: 'Brompton, C-Line, rouge, M' })] },
      [],
      ctx,
      { clients: [client({})], marques: [marque({})], equipe: [] },
    );
    expect(result.phantoms[0]!.marqueId).toBe('marque_brompton');
  });

  it('skip quand le client est introuvable', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({ clientNom: 'Inconnu Personne' })] },
      [],
      ctx,
      { clients: [client({})], marques: [], equipe: [] },
    );

    expect(result.phantoms).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]!.reason).toMatch(/client introuvable/);
  });

  it('ne crée pas de phantom si le vélo existe déjà (pas d\'overlap)', () => {
    const existing: V2VeloDraft = {
      id: 'velo_existing',
      workshopId: 'workshop_test',
      clientId: 'client_1',
      marqueId: null,
      veloNumero: 102,
      status: 'RECU',
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
      noteClientEval: null,
      noteClientFacture: null,
      notes: null,
    };

    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({ id: '0102' })] },
      [existing],
      ctx,
      { clients: [client({})], marques: [], equipe: [] },
    );

    expect(result.phantoms).toHaveLength(0);
  });

  it('dédup les BDC actifs et archivés portant le même id (archive prioritaire)', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      {
        actifs: [actif({ id: '0130', clientNom: 'Marie Dupont', veloDesc: 'Article de base' })],
        archives: [archive({ id: '0130', veloDesc: 'Opus, Mondano 1, Noir, M' })],
      },
      [],
      ctx,
      { clients: [client({})], marques: [], equipe: [equipeMember({})] },
    );

    expect(result.phantoms).toHaveLength(1);
    // L'archive a priorité (info plus riche : modele non vide, mecano résolu)
    expect(result.phantoms[0]!.modele).toBe('Mondano 1');
  });

  it('crée un phantom pour un BDC actif sans vélo (cas 0106 sans archive)', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [actif({ id: '0106', clientNom: 'Marie Dupont' })], archives: [] },
      [],
      ctx,
      { clients: [client({})], marques: [], equipe: [] },
    );

    expect(result.phantoms).toHaveLength(1);
    expect(result.phantoms[0]!.veloNumero).toBe(106);
    expect(result.phantoms[0]!.status).toBe('APPROUVE'); // mappé depuis evalStatus
  });

  it('mappe différents archiveStatus vers V2VeloStatus', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      {
        actifs: [],
        archives: [
          archive({ id: '0001', archiveStatus: 'FACTURÉ' }),
          archive({ id: '0002', archiveStatus: 'CTRL QLTÉ' }),
          archive({ id: '0003', archiveStatus: 'REFUSÉ' }),
          archive({ id: '0004', archiveStatus: 'ARCHIVÉ' }),
        ],
      },
      [],
      ctx,
      { clients: [client({})], marques: [], equipe: [] },
    );

    const byNum = new Map(result.phantoms.map((p) => [p.veloNumero, p.status]));
    expect(byNum.get(1)).toBe('FACTURE');
    expect(byNum.get(2)).toBe('CTRL_QLTE');
    expect(byNum.get(3)).toBe('FINI');
    expect(byNum.get(4)).toBe('FACTURE');
  });

  it('parse veloDesc avec valeurs vides ou ...', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({ veloDesc: 'Brompton, ..., , .' })] },
      [],
      ctx,
      { clients: [client({})], marques: [marque({})], equipe: [] },
    );

    const ph = result.phantoms[0]!;
    expect(ph.marqueId).toBe('marque_brompton');
    expect(ph.modele).toBeNull();
    expect(ph.couleur).toBeNull();
    expect(ph.taille).toBeNull();
  });

  it('skip silencieusement les ids non numériques', () => {
    const result = createPhantomVelosForOrphanedBdcs(
      { actifs: [], archives: [archive({ id: 'ABC' })] },
      [],
      ctx,
      { clients: [client({})], marques: [], equipe: [] },
    );

    expect(result.phantoms).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});
