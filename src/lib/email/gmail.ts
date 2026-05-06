import nodemailer, { type Transporter } from 'nodemailer';

// Gmail SMTP via nodemailer. Nécessite :
//   - GMAIL_USER (ex yako.cyclo@gmail.com)
//   - GMAIL_APP_PASSWORD (16 chars, généré sur https://myaccount.google.com/apppasswords)
//     → Le compte Google doit avoir 2FA activé pour générer un App Password.
//
// Avantages vs SMTP générique : pas de config host/port/tls (Gmail bien connu).
// Limites : ~500 emails/24h pour comptes gratuits, ~2000/24h Workspace.

let _transporter: Transporter | null = null;

export function getGmailTransporter(): Transporter {
  if (_transporter) return _transporter;
  const user = process.env['GMAIL_USER'];
  const pass = process.env['GMAIL_APP_PASSWORD'];
  if (!user || !pass) {
    throw new Error('GMAIL_USER ou GMAIL_APP_PASSWORD non configuré');
  }
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return _transporter;
}

export function isGmailConfigured(): boolean {
  return Boolean(process.env['GMAIL_USER'] && process.env['GMAIL_APP_PASSWORD']);
}

export function gmailFromAddress(displayName?: string | null): string {
  const user = process.env['GMAIL_USER'] ?? '';
  return displayName ? `${displayName} <${user}>` : user;
}
