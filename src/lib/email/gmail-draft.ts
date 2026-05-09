// Création d'un brouillon Gmail via Gmail API (scope gmail.compose).
// Le brouillon apparaît dans le compte Gmail connecté de l'utilisateur ;
// il doit l'ouvrir manuellement et cliquer "Envoyer". Le scope ne permet
// PAS d'envoi automatique, c'est volontaire (pattern V1 = filet de
// relecture pour factures et évaluations).

import { refreshAccessToken } from './google-oauth';

const GMAIL_DRAFTS_URL =
  'https://gmail.googleapis.com/gmail/v1/users/me/drafts';

export type GmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type CreateDraftInput = {
  refreshToken: string;
  to: string;
  from: string;
  subject: string;
  htmlBody: string;
  attachments?: GmailAttachment[];
};

export type CreateDraftResult =
  | { ok: true; draftId: string; messageId: string }
  | { ok: false; error: string };

// Encode un message email au format MIME multipart/related (HTML + pièces
// jointes), puis base64url comme demandé par Gmail API.
function buildMime(opts: {
  to: string;
  from: string;
  subject: string;
  htmlBody: string;
  attachments: GmailAttachment[];
}): string {
  const boundary = `flex-${Math.random().toString(36).slice(2, 10)}`;
  const headers = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${encodeRfc2047(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].join('\r\n');

  const htmlPart =
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
    `${opts.htmlBody}\r\n`;

  const attachmentParts = opts.attachments
    .map((a) => {
      const ct = a.contentType ?? guessContentType(a.filename);
      const b64 = a.content.toString('base64').replace(/(.{76})/g, '$1\r\n');
      return (
        `--${boundary}\r\n` +
        `Content-Type: ${ct}; name="${a.filename}"\r\n` +
        `Content-Disposition: attachment; filename="${a.filename}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${b64}\r\n`
      );
    })
    .join('');

  const closing = `--${boundary}--\r\n`;
  return `${headers}\r\n\r\n${htmlPart}${attachmentParts}${closing}`;
}

// Encode un sujet pour respecter RFC 2047 si caractères non-ASCII.
function encodeRfc2047(s: string): string {
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

function guessContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'csv') return 'text/csv';
  return 'application/octet-stream';
}

function base64url(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createGmailDraft(
  input: CreateDraftInput,
): Promise<CreateDraftResult> {
  let accessToken: string;
  try {
    const r = await refreshAccessToken(input.refreshToken);
    accessToken = r.access_token;
  } catch (err) {
    return {
      ok: false,
      error: `Refresh token invalide ou révoqué — reconnecte Gmail. (${err instanceof Error ? err.message : String(err)})`,
    };
  }

  const mime = buildMime({
    to: input.to,
    from: input.from,
    subject: input.subject,
    htmlBody: input.htmlBody,
    attachments: input.attachments ?? [],
  });

  const r = await fetch(GMAIL_DRAFTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw: base64url(mime) },
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    return { ok: false, error: `Gmail draft API: ${r.status} ${err.slice(0, 200)}` };
  }
  const data = (await r.json()) as { id: string; message: { id: string } };
  return { ok: true, draftId: data.id, messageId: data.message.id };
}
