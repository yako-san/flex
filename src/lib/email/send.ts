import type { EmailKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { generateId } from '@/lib/ids/generate-id';
import { getEmailProvider, getResend } from './client';
import { getGmailTransporter } from './gmail';
import { createGmailDraft } from './gmail-draft';

// Mode d'envoi (Sprint 2.7) :
//   'send'  — envoi direct via SMTP/Resend (pattern existant)
//   'draft' — création d'un brouillon Gmail via Gmail API (refresh_token
//             du Workshop). L'utilisateur ouvre Gmail, vérifie, clique
//             Envoyer manuellement. Préserve le filet de relecture V1.
export type SendMode = 'send' | 'draft';

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
  mode?: SendMode; // default 'send'
  // Refresh token Gmail (uniquement requis si mode='draft')
  googleRefreshToken?: string | null;
};

export type SendEmailResult =
  | { ok: true; emailLogId: string; providerMsgId: string | null; mode: SendMode }
  | { ok: false; error: string; emailLogId: string };

// Envoie un email via le provider actif (Gmail SMTP ou Resend) ou crée
// un brouillon Gmail via Gmail API (mode='draft'). Persiste un EmailLog
// (audit trail).
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const emailLogId = generateId('log');
  const mode: SendMode = input.mode ?? 'send';

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

  // Mode draft : Gmail API (gmail.compose) — pas d'envoi automatique.
  if (mode === 'draft') {
    if (!input.googleRefreshToken) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'FAILED',
          providerError: "Gmail non connecté — connecte le compte dans Paramètres",
        },
      });
      return {
        ok: false,
        error: 'Gmail non connecté pour ce workshop',
        emailLogId,
      };
    }
    const draftResult = await createGmailDraft({
      refreshToken: input.googleRefreshToken,
      to: input.to,
      from: input.from,
      subject: input.subject,
      htmlBody: input.html,
      ...(input.attachments && input.attachments.length > 0
        ? { attachments: input.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
        : {}),
    });
    if (!draftResult.ok) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: { status: 'FAILED', providerError: draftResult.error },
      });
      return { ok: false, error: draftResult.error, emailLogId };
    }
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'DRAFT',
        sentAt: new Date(), // moment de création du draft
        providerMsgId: `draft_${draftResult.draftId}`,
      },
    });
    return { ok: true, emailLogId, providerMsgId: draftResult.draftId, mode };
  }

  const provider = getEmailProvider();
  if (provider === 'NONE') {
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'FAILED',
        providerError:
          'Aucun provider email configuré (GMAIL_USER+APP_PASSWORD ou RESEND_API_KEY)',
      },
    });
    return {
      ok: false,
      error: 'Service courriel non configuré',
      emailLogId,
    };
  }

  try {
    let providerMsgId: string | null = null;

    if (provider === 'GMAIL') {
      const transport = getGmailTransporter();
      const result = await transport.sendMail({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });
      providerMsgId = result.messageId ?? null;
    } else {
      // RESEND
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
        throw new Error(result.error.message);
      }
      providerMsgId = result.data?.id ?? null;
    }

    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: 'SENT', sentAt: new Date(), providerMsgId },
    });
    return { ok: true, emailLogId, providerMsgId, mode };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur provider inconnue';
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: 'FAILED', providerError: msg },
    });
    return { ok: false, error: msg, emailLogId };
  }
}
