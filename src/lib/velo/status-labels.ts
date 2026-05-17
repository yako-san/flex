// Mapping enum DB BdcEvalStatus / VeloStatus → label affichable.
//
// V2 a normalisé les enums DB (RECU au lieu de REÇU, EVAL au lieu de ÉVAL.,
// ON_BENCH au lieu de "ON BENCH", etc.) pour respecter les conventions
// d'identifiant SQL/TS. Mais l'UI doit afficher les versions originales V1
// pour préserver les repères visuels du user.
//
// Couleurs : reprises depuis V1 `lib/utils/statuts.ts` section 2 du
// v1-reference.md.

import type { VeloStatus, BdcEvalStatus } from '@prisma/client';

export type Locale = 'fr' | 'en';

type Label = { fr: string; en: string };

export const VELO_STATUS_LABELS: Record<VeloStatus, Label> = {
  RV:         { fr: 'RV',         en: 'Booked' },
  RECU:       { fr: 'REÇU',       en: 'Received' },
  EVAL:       { fr: 'ÉVAL.',      en: 'Eval.' },
  EN_ATTENTE: { fr: 'EN ATTENTE', en: 'Waiting' },
  APPROUVE:   { fr: 'APPROUVÉ',   en: 'Approved' },
  ON_BENCH:   { fr: 'ON BENCH',   en: 'On bench' },
  CTRL_QLTE:  { fr: 'CTRL QLTÉ',  en: 'QC' },
  FINI:       { fr: 'FINI',       en: 'Done' },
  LIVRE:      { fr: 'LIVRÉ',      en: 'Delivered' },
  FACTURER:   { fr: 'FACTURER',   en: 'To invoice' },
  FACTURE:    { fr: 'FACTURÉ',    en: 'Invoiced' },
};

export const VELO_STATUS_COLORS: Record<VeloStatus, { bg: string; fg: string }> = {
  RV:         { bg: '#fff056', fg: '#000000' },
  RECU:       { bg: '#fff056', fg: '#000000' },
  EVAL:       { bg: '#fff056', fg: '#000000' },
  EN_ATTENTE: { bg: '#fb923c', fg: '#000000' },
  APPROUVE:   { bg: '#62e335', fg: '#000000' },
  ON_BENCH:   { bg: '#5cd62b', fg: '#000000' },
  CTRL_QLTE:  { bg: '#2e7d32', fg: '#ffffff' },
  FINI:       { bg: '#fce4ec', fg: '#c62828' },
  LIVRE:      { bg: '#e0e0e0', fg: '#333333' },
  FACTURER:   { bg: '#e53935', fg: '#ffffff' },
  FACTURE:    { bg: '#ffcdd2', fg: '#b71c1c' },
};

export const BDC_EVAL_STATUS_LABELS: Record<BdcEvalStatus, Label> = {
  INDECIS:  { fr: 'Indécis',    en: 'Pending' },
  ATTENTE:  { fr: 'En attente', en: 'Waiting' },
  APPROUVE: { fr: 'Approuvé',   en: 'Approved' },
  REDUX:    { fr: 'Redux',      en: 'Reduced' },
  REFUSE:   { fr: 'Refusé',     en: 'Refused' },
};

export function veloStatusLabel(status: VeloStatus, locale: Locale = 'fr'): string {
  return VELO_STATUS_LABELS[status][locale];
}

export function veloStatusColors(status: VeloStatus): { bg: string; fg: string } {
  return VELO_STATUS_COLORS[status];
}

export function bdcEvalStatusLabel(status: BdcEvalStatus, locale: Locale = 'fr'): string {
  return BDC_EVAL_STATUS_LABELS[status][locale];
}

// Ordre canonique workflow vélo (pour tri / sélecteurs).
export const VELO_STATUS_ORDER: VeloStatus[] = [
  'RV', 'RECU', 'EVAL', 'EN_ATTENTE', 'APPROUVE',
  'ON_BENCH', 'CTRL_QLTE', 'FINI', 'FACTURER', 'FACTURE', 'LIVRE',
];
