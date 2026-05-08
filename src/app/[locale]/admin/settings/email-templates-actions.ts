'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

const schema = z.object({
  evalSubject: z.string().trim().max(200).optional().nullable(),
  evalBody: z.string().max(10000).optional().nullable(),
  factureSubject: z.string().trim().max(200).optional().nullable(),
  factureBody: z.string().max(10000).optional().nullable(),
  venteSubject: z.string().trim().max(200).optional().nullable(),
  venteBody: z.string().max(10000).optional().nullable(),
  smsRappelBody: z.string().max(1000).optional().nullable(),
  smsSuiviBody: z.string().max(1000).optional().nullable(),
});

export type EmailTemplatesState = { error?: string; success?: boolean };

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

  const parsed = schema.safeParse({
    evalSubject: clean(formData.get('evalSubject')),
    evalBody: clean(formData.get('evalBody')),
    factureSubject: clean(formData.get('factureSubject')),
    factureBody: clean(formData.get('factureBody')),
    venteSubject: clean(formData.get('venteSubject')),
    venteBody: clean(formData.get('venteBody')),
    smsRappelBody: clean(formData.get('smsRappelBody')),
    smsSuiviBody: clean(formData.get('smsSuiviBody')),
  });
  if (!parsed.success) return { error: 'Validation échouée' };

  const d = parsed.data;
  const evalT: Record<string, string> = {};
  if (d.evalSubject) evalT['subject'] = d.evalSubject;
  if (d.evalBody) evalT['body'] = d.evalBody;

  const factureT: Record<string, string> = {};
  if (d.factureSubject) factureT['subject'] = d.factureSubject;
  if (d.factureBody) factureT['body'] = d.factureBody;

  const venteT: Record<string, string> = {};
  if (d.venteSubject) venteT['subject'] = d.venteSubject;
  if (d.venteBody) venteT['body'] = d.venteBody;

  const smsRappelT: Record<string, string> = {};
  if (d.smsRappelBody) smsRappelT['body'] = d.smsRappelBody;

  const smsSuiviT: Record<string, string> = {};
  if (d.smsSuiviBody) smsSuiviT['body'] = d.smsSuiviBody;

  const payload: Record<string, unknown> = {};
  if (Object.keys(evalT).length > 0) payload['eval'] = evalT;
  if (Object.keys(factureT).length > 0) payload['facture'] = factureT;
  if (Object.keys(venteT).length > 0) payload['vente'] = venteT;
  if (Object.keys(smsRappelT).length > 0) payload['smsRappel'] = smsRappelT;
  if (Object.keys(smsSuiviT).length > 0) payload['smsSuivi'] = smsSuiviT;

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: {
      emailTemplates:
        Object.keys(payload).length > 0
          ? (payload as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });

  revalidatePath('/[locale]/admin/settings', 'page');
  revalidatePath('/[locale]/admin/settings/email-templates', 'page');
  return { success: true };
}
