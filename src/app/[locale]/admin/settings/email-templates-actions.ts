'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export type EmailTemplatesState = { error?: string; success?: boolean };

const KINDS = ['eval', 'facture', 'vente', 'courrielSuivi'] as const;
const FIELDS = ['subject', 'body', 'greeting', 'intro', 'cta', 'outro'] as const;
const LOCALES = ['fr', 'en'] as const;

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v);
  return s.trim() === '' ? null : s;
}

export async function updateEmailTemplatesAction(
  _prev: EmailTemplatesState | null,
  formData: FormData,
): Promise<EmailTemplatesState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  // Construit la structure depuis les champs form ${kind}_${field}_${locale}
  const result: Record<string, unknown> = {};
  for (const kind of KINDS) {
    const sub: Record<string, Record<string, string>> = {};
    for (const field of FIELDS) {
      for (const locale of LOCALES) {
        const v = clean(formData.get(`${kind}_${field}_${locale}`));
        if (v) {
          if (!sub[field]) sub[field] = {};
          sub[field]![locale] = v;
        }
      }
    }
    if (Object.keys(sub).length > 0) result[kind] = sub;
  }

  // SMS rappel + suivi (body uniquement)
  for (const kind of ['smsRappel', 'smsSuivi'] as const) {
    const body: Record<string, string> = {};
    for (const locale of LOCALES) {
      const v = clean(formData.get(`${kind}_body_${locale}`));
      if (v) body[locale] = v;
    }
    if (Object.keys(body).length > 0) result[kind] = { body };
  }

  // Outro global
  const outro: Record<string, string> = {};
  for (const locale of LOCALES) {
    const v = clean(formData.get(`outro_${locale}`));
    if (v) outro[locale] = v;
  }
  if (Object.keys(outro).length > 0) result['outro'] = outro;

  // Signatures
  const signatures: Record<string, string> = {};
  for (const k of ['yako', 'cf'] as const) {
    const v = clean(formData.get(`signatures_${k}`));
    if (v) signatures[k] = v;
  }
  if (Object.keys(signatures).length > 0) result['signatures'] = signatures;

  // Préserve _unmapped existant (clés v1 non reconnues ne doivent pas être perdues
  // entre 2 saves — on relit la valeur actuelle et on la merge).
  const current =
    (workshop.emailTemplates as { _unmapped?: Record<string, string> } | null) ?? null;
  if (current?._unmapped && Object.keys(current._unmapped).length > 0) {
    result['_unmapped'] = current._unmapped;
  }

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: {
      emailTemplates:
        Object.keys(result).length > 0
          ? (result as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });

  revalidatePath('/[locale]/admin/settings', 'page');
  revalidatePath('/[locale]/admin/settings/email-templates', 'page');
  return { success: true };
}
