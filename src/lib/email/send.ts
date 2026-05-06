import type { EmailKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { generateId } from '@/lib/ids/generate-id';
import { getResend, isEmailConfigured } from './client';

export type SendEmailInput = {
  workshopId: string;
  kind: EmailKind;
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
  bdcId?: string | null;
  factureLogId?: string | null;
  clientId?: string | null;
  createdById?: string | null;
};

export type SendEmailResult =
  | { ok: true; emailLogId: string; providerMsgId: string | null }
  | { ok: false; error: string; emailLogId: string };

// Envoie un email via Resend + persiste un EmailLog (audit trail).
// Si Resend n'est pas configuré (env manquant), retourne FAILED avec
// une erreur explicite mais persiste quand même le log pour traçabilité.
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const emailLogId = generateId('log');

  // Audit pre-send : on enregistre PENDING avant l'appel API
  await prisma.emailLog.create({
    data: {
      id: emailLogId,
      workshopId: input.workshopId,
      kind: input.kind,
      status: 'PENDING',
      toEmail: input.to,
      fromEmail: input.from,
      subject: input.subject,
      bodyHtml: input.html,
      bdcId: input.bdcId ?? null,
      factureLogId: input.factureLogId ?? null,
      clientId: input.clientId ?? null,
      createdById: input.createdById ?? null,
    },
  });

  if (!isEmailConfigured()) {
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'FAILED',
        providerError: 'RESEND_API_KEY non configuré côté serveur',
      },
    });
    return {
      ok: false,
      error: 'Service courriel non configuré (RESEND_API_KEY manquant)',
      emailLogId,
    };
  }

  try {
    const resend = getResend();
    const sendOpts: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: { filename: string; content: Buffer }[];
    } = {
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    };
    if (input.attachments && input.attachments.length > 0) {
      sendOpts.attachments = input.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }
    const result = await resend.emails.send(sendOpts);

    if (result.error) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'FAILED',
          providerError: result.error.message,
        },
      });
      return { ok: false, error: result.error.message, emailLogId };
    }

    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerMsgId: result.data?.id ?? null,
      },
    });
    return { ok: true, emailLogId, providerMsgId: result.data?.id ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur Resend inconnue';
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: 'FAILED', providerError: msg },
    });
    return { ok: false, error: msg, emailLogId };
  }
}
