'use client';

import { useState, useTransition } from 'react';
import {
  sendEvalEmailAction,
  sendFactureEmailAction,
  sendSuiviEmailAction,
  type EmailState,
} from './email-actions';

type Kind = 'eval' | 'facture' | 'suivi';

type Props = {
  bdcId: string;
  clientCourriel: string | null;
  evalEnvoyee: boolean;
  suiviEnvoye: boolean;
  factureLogId: string | null;
  factureNumero: string | null;
};

export function EmailButtons({
  bdcId,
  clientCourriel,
  evalEnvoyee,
  suiviEnvoye,
  factureLogId,
  factureNumero: _factureNumero,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [show, setShow] = useState<Kind | null>(null);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<EmailState | null>(null);

  if (!clientCourriel) {
    return (
      <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0 0' }}>
        ⓘ Pas de courriel client renseigné — saisis-le sur la fiche client pour
        activer l&apos;envoi par courriel.
      </p>
    );
  }

  function send(kind: Kind) {
    setResult(null);
    startTransition(async () => {
      const r =
        kind === 'eval'
          ? await sendEvalEmailAction(bdcId, msg.trim() || null)
          : kind === 'suivi'
            ? await sendSuiviEmailAction(bdcId, msg.trim() || null)
            : factureLogId
              ? await sendFactureEmailAction(factureLogId, msg.trim() || null)
              : { error: 'Pas de facture émise', success: false };
      setResult(r);
      if (r.success) {
        setShow(null);
        setMsg('');
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
      <button
        type="button"
        onClick={() => setShow(show === 'eval' ? null : 'eval')}
        style={{
          ...btn,
          color: evalEnvoyee ? '#2e7d32' : '#1565c0',
          borderColor: evalEnvoyee ? '#2e7d32' : '#1565c0',
        }}
      >
        ✉️ {evalEnvoyee ? 'Renvoyer l\'éval par courriel' : 'Envoyer l\'éval par courriel'}
      </button>
      {factureLogId ? (
        <button
          type="button"
          onClick={() => setShow(show === 'facture' ? null : 'facture')}
          style={btn}
        >
          ✉️ Envoyer la facture par courriel
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setShow(show === 'suivi' ? null : 'suivi')}
        style={{
          ...btn,
          color: suiviEnvoye ? '#2e7d32' : '#1565c0',
          borderColor: suiviEnvoye ? '#2e7d32' : '#1565c0',
        }}
      >
        ✉️ {suiviEnvoye ? 'Renvoyer le courriel de suivi' : 'Envoyer le courriel de suivi'}
      </button>

      {show ? (
        <div style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 4, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.4rem' }}>
            Destinataire : <code>{clientCourriel}</code>
          </div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Message personnalisé (optionnel) — ajouté en encart au courriel."
            rows={3}
            style={{
              width: '100%',
              padding: '0.45rem 0.5rem',
              fontSize: '0.85rem',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '0.5rem',
            }}
          />
          <button
            type="button"
            onClick={() => send(show)}
            disabled={pending}
            style={{
              width: '100%',
              padding: '0.55rem 0.9rem',
              background: pending ? '#999' : '#1a1a1a',
              color: 'white',
              border: 0,
              borderRadius: 4,
              cursor: pending ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {pending ? 'Envoi…' : 'Envoyer maintenant'}
          </button>
        </div>
      ) : null}

      {result?.error ? (
        <div style={{ color: '#c62828', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: '#ffebee', borderRadius: 4 }}>
          {result.error}
        </div>
      ) : null}
      {result?.success ? (
        <div style={{ color: '#2e7d32', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: '#e8f5e9', borderRadius: 4 }}>
          ✓ Courriel envoyé.
        </div>
      ) : null}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  background: 'white',
  color: '#1565c0',
  border: '1px solid #1565c0',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.85rem',
  textAlign: 'left',
};
