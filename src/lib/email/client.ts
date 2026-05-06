import { Resend } from 'resend';

// Singleton Resend client. RESEND_API_KEY est requis pour l'envoi réel ;
// si absent, on log un warning mais on ne crash pas (utile en dev local).
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    throw new Error('RESEND_API_KEY non configuré');
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env['RESEND_API_KEY']);
}
