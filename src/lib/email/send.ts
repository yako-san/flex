import type { EmailKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { generateId } from '@/lib/ids/generate-id';
import { getEmailProvider, getResend } from './client';
import { getGmailTransporter } from './gmail';

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

// Envoie un email via le provider actif (Gmail SMTP ou Resend) +
// persiste un EmailLog (audit trail).
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const emailLogId = generateId('log');

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
    return { ok: true, emailLogId, providerMsgId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur provider inconnue';
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: 'FAILED', providerError: msg },
    });
    return { ok: false, error: msg, emailLogId };
  }
}
