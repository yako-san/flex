import { describe, expect, it } from 'vitest';
import type { BdcEvalStatus, VeloStatus } from '@prisma/client';
import {
  BDC_EVAL_STATUS_LABELS,
  bdcEvalStatusLabel,
  VELO_STATUS_COLORS,
  VELO_STATUS_LABELS,
  VELO_STATUS_ORDER,
  veloStatusColors,
  veloStatusLabel,
} from './status-labels';

const ALL_VELO: VeloStatus[] = [
  'RV', 'RECU', 'EVAL', 'EN_ATTENTE', 'APPROUVE',
  'ON_BENCH', 'CTRL_QLTE', 'FINI', 'LIVRE', 'FACTURER', 'FACTURE',
];

const ALL_EVAL: BdcEvalStatus[] = ['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE'];

describe('VELO_STATUS_LABELS', () => {
  it('chaque VeloStatus a un label FR et EN', () => {
    for (const s of ALL_VELO) {
      const label = VELO_STATUS_LABELS[s];
      expect(label.fr).toBeTruthy();
      expect(label.en).toBeTruthy();
    }
  });

  it('labels FR utilisent les accents V1 (REÇU, ÉVAL., LIVRÉ, FACTURÉ, APPROUVÉ)', () => {
    expect(VELO_STATUS_LABELS.RECU.fr).toBe('REÇU');
    expect(VELO_STATUS_LABELS.EVAL.fr).toBe('ÉVAL.');
    expect(VELO_STATUS_LABELS.LIVRE.fr).toBe('LIVRÉ');
    expect(VELO_STATUS_LABELS.FACTURE.fr).toBe('FACTURÉ');
    expect(VELO_STATUS_LABELS.APPROUVE.fr).toBe('APPROUVÉ');
  });
});

describe('veloStatusLabel', () => {
  it("locale par défaut = 'fr'", () => {
    expect(veloStatusLabel('RECU')).toBe('REÇU');
  });

  it("locale 'en'", () => {
    expect(veloStatusLabel('RECU', 'en')).toBe('Received');
  });

  it('chaque statut a une traduction non-vide en FR et EN', () => {
    for (const s of ALL_VELO) {
      expect(veloStatusLabel(s, 'fr')).toBeTruthy();
      expect(veloStatusLabel(s, 'en')).toBeTruthy();
    }
  });
});

describe('VELO_STATUS_COLORS', () => {
  it('chaque VeloStatus a bg + fg', () => {
    for (const s of ALL_VELO) {
      const c = VELO_STATUS_COLORS[s];
      expect(c.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.fg).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('RV/RECU = jaune signature V1', () => {
    expect(VELO_STATUS_COLORS.RV.bg).toBe('#fff056');
    expect(VELO_STATUS_COLORS.RECU.bg).toBe('#fff056');
  });
});

describe('veloStatusColors', () => {
  it('renvoie bg + fg', () => {
    const c = veloStatusColors('CTRL_QLTE');
    expect(c).toEqual({ bg: '#2e7d32', fg: '#ffffff' });
  });
});

describe('BDC_EVAL_STATUS_LABELS', () => {
  it('chaque BdcEvalStatus a label FR + EN', () => {
    for (const s of ALL_EVAL) {
      expect(BDC_EVAL_STATUS_LABELS[s].fr).toBeTruthy();
      expect(BDC_EVAL_STATUS_LABELS[s].en).toBeTruthy();
    }
  });
});

describe('bdcEvalStatusLabel', () => {
  it("locale par défaut = 'fr'", () => {
    expect(bdcEvalStatusLabel('INDECIS')).toBe('Indécis');
  });

  it("locale 'en'", () => {
    expect(bdcEvalStatusLabel('REDUX', 'en')).toBe('Reduced');
  });
});

describe('VELO_STATUS_ORDER', () => {
  it('contient les 11 statuts canoniques sans doublon', () => {
    expect(VELO_STATUS_ORDER).toHaveLength(11);
    expect(new Set(VELO_STATUS_ORDER).size).toBe(11);
  });

  it('commence par RV (workflow début)', () => {
    expect(VELO_STATUS_ORDER[0]).toBe('RV');
  });

  it('termine par LIVRE (workflow fin)', () => {
    expect(VELO_STATUS_ORDER[10]).toBe('LIVRE');
  });

  it('contient toutes les valeurs enum', () => {
    for (const s of ALL_VELO) {
      expect(VELO_STATUS_ORDER).toContain(s);
    }
  });
});
