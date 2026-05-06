import { Resend } from 'resend';
import { isGmailConfigured } from './gmail';

// Auto-détection du provider email actif. Priorité Gmail (familier user) sur Resend.
export type EmailProvider = 'GMAIL' | 'RESEND' | 'NONE';

export function getEmailProvider(): EmailProvider {
  if (isGmailConfigured()) return 'GMAIL';
  if (process.env['RESEND_API_KEY']) return 'RESEND';
  return 'NONE';
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== 'NONE';
}

// === Resend (futur multi-tenant) ===
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) throw new Error('RESEND_API_KEY non configuré');
  _resend = new Resend(apiKey);
  return _resend;
}
