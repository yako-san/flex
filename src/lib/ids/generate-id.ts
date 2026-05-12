import { ulid } from 'ulid';

export const ID_PREFIXES = [
  'workshop',
  'user',
  'member',
  'client',
  'velo',
  'bdc',
  'bdci',
  'task',
  'service',
  'piece',
  'forfait',
  'marque',
  'facture',
  'vente',
  'vdi',
  'po',
  'poi',
  'mov',
  'ctr',
  'eq',
  'translation',
  'log',
  'map',
  'ftt',
  'bphoto',
] as const;

export type IdPrefix = (typeof ID_PREFIXES)[number];

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${ulid()}`;
}
