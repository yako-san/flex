import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { parseDureeHHMM } from '../../normalize/parse-duree-hhmm';
import type {
  CatalogueImportResult,
  ImportContext,
  V2ForfaitDraft,
  V2ForfaitTaskTemplateDraft,
  V2ServiceDraft,
  V2TranslationDraft,
} from './types';

export type V1CatalogueService = {
  serviceId: string;
  label: string;
  duree: string;
  categorie: string;
  prix: number;
  categoriePrio: string;
};

type LineKind = 'FORFAIT' | 'SUBTASK' | 'HEADER' | 'SERVICE';

const FORFAIT_PREFIX = '👌🏻 Forfait';
const HEADER_EM_DASH = '— '; // em dash + espace (titre section ou content marker)
const SUBTASK_HYPHEN = '- '; // hyphen + espace

function classify(label: string): LineKind {
  const t = label.trim();
  if (t === '' || t === '—' || t === '-') return 'HEADER';
  if (t.startsWith(HEADER_EM_DASH)) return 'HEADER';
  if (t.startsWith(FORFAIT_PREFIX)) return 'FORFAIT';
  if (t.startsWith(SUBTASK_HYPHEN)) return 'SUBTASK';
  return 'SERVICE';
}

function decimalString(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return String(n);
}

export function transformCatalogueServices(
  v1: V1CatalogueService[],
  ctx: ImportContext,
): CatalogueImportResult {
  const services: V2ServiceDraft[] = [];
  const forfaits: V2ForfaitDraft[] = [];
  const taskTemplates: V2ForfaitTaskTemplateDraft[] = [];
  const translations: V2TranslationDraft[] = [];
  const skipped: CatalogueImportResult['skipped'] = [];
  const now = new Date();

  let currentForfaitId: string | null = null;
  let currentForfaitPosition = 0;

  function pushTranslation(
    entityType: V2TranslationDraft['entityType'],
    entityId: string,
    label: string,
  ) {
    translations.push({
      id: generateId('translation'),
      workshopId: ctx.workshopId,
      entityType,
      entityId,
      field: 'label',
      locale: ctx.defaultLocale,
      value: label,
      source: 'USER',
      reviewedAt: now,
      reviewedById: null,
    });
  }

  for (const raw of v1) {
    const label = (raw.label ?? '').trim();
    const kind = classify(label);

    switch (kind) {
      case 'HEADER': {
        skipped.push({
          reason: 'header de section ou marqueur visuel v1',
          entityType: 'service',
          raw,
        });
        // "— Ce service inclut..." apparaît juste après un Forfait et marque le
        // début de ses sous-items. On NE reset PAS le contexte forfait pour
        // un header content marker — uniquement pour un séparateur de section
        // ("— SERVICES À LA CARTE", "—", "— DIVERS", "— RENCONTRE").
        // Heuristique : si le header commence par "— Ce service inclut", on
        // préserve le contexte forfait ; sinon reset.
        if (!label.startsWith('— Ce service inclut')) {
          currentForfaitId = null;
          currentForfaitPosition = 0;
        }
        break;
      }

      case 'FORFAIT': {
        const forfait: V2ForfaitDraft = {
          id: generateId('forfait'),
          workshopId: ctx.workshopId,
          legacyCode: normalizeNonValue(raw.serviceId),
          labelCanonical: label,
          prix: decimalString(raw.prix),
          dureeMinutes: parseDureeHHMM(raw.duree),
          taxable: true,
        };
        forfaits.push(forfait);
        pushTranslation('FORFAIT', forfait.id, label);
        currentForfaitId = forfait.id;
        currentForfaitPosition = 0;
        break;
      }

      case 'SUBTASK': {
        if (currentForfaitId === null) {
          skipped.push({
            reason: 'sous-tâche orpheline (pas dans une zone forfait)',
            entityType: 'service',
            raw,
          });
          break;
        }
        currentForfaitPosition += 1;
        taskTemplates.push({
          id: generateId('ftt'),
          forfaitId: currentForfaitId,
          labelCanonical: label,
          position: currentForfaitPosition,
        });
        break;
      }

      case 'SERVICE': {
        const service: V2ServiceDraft = {
          id: generateId('service'),
          workshopId: ctx.workshopId,
          legacyCode: normalizeNonValue(raw.serviceId),
          labelCanonical: label,
          categorie: normalizeNonValue(raw.categorie),
          categoriePrio: normalizeNonValue(raw.categoriePrio),
          dureeMinutes: parseDureeHHMM(raw.duree),
          prix: decimalString(raw.prix),
          taxable: true,
        };
        services.push(service);
        pushTranslation('SERVICE', service.id, label);

        // Un vrai service à la carte ferme la zone forfait.
        currentForfaitId = null;
        currentForfaitPosition = 0;
        break;
      }
    }
  }

  return { services, forfaits, taskTemplates, translations, skipped };
}
