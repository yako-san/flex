'use client';

import { useState, useTransition } from 'react';
import { Mail, Send, FileEdit, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  sendEvalEmailAction,
  sendFactureEmailAction,
  sendSuiviEmailAction,
  type EmailState,
  type EmailMode,
} from './email-actions';

type Kind = 'eval' | 'facture' | 'suivi';

type Props = {
  bdcId: string;
  clientCourriel: string | null;
  evalEnvoyee: boolean;
  suiviEnvoye: boolean;
  factureLogId: string | null;
  factureNumero: string | null;
  /** Si Workshop a connecté un Gmail (Sprint 2.7), affiche le toggle
   *  brouillon. Sinon, masqué (envoi direct only). */
  gmailConnected: boolean;
  gmailEmail: string | null;
};

export function EmailButtons({
  bdcId,
  clientCourriel,
  evalEnvoyee,
  suiviEnvoye,
  factureLogId,
  factureNumero: _factureNumero,
  gmailConnected,
  gmailEmail,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [show, setShow] = useState<Kind | null>(null);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<EmailState | null>(null);
  // Mode par défaut : 'draft' si Gmail connecté (filet de relecture V1),
  // sinon 'send' direct (SMTP/Resend).
  const [mode, setMode] = useState<EmailMode>(gmailConnected ? 'draft' : 'send');

  if (!clientCourriel) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs italic text-[var(--text-secondary-60)]">
        <AlertCircle size={12} />
        Pas de courriel client — saisis-le sur la fiche client pour activer l&apos;envoi.
      </p>
    );
  }

  const send = (kind: Kind) => {
    setResult(null);
    startTransition(async () => {
      const r =
        kind === 'eval'
          ? await sendEvalEmailAction(bdcId, msg.trim() || null, mode)
          : kind === 'suivi'
            ? await sendSuiviEmailAction(bdcId, msg.trim() || null, mode)
            : factureLogId
              ? await sendFactureEmailAction(factureLogId, msg.trim() || null, mode)
              : { error: 'Pas de facture émise', success: false };
      setResult(r);
      if (r.success) {
        setShow(null);
        setMsg('');
      }
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <EmailTriggerBtn
        active={show === 'eval'}
        done={evalEnvoyee}
        onClick={() => setShow(show === 'eval' ? null : 'eval')}
        label={evalEnvoyee ? "Renvoyer l'éval par courriel" : "Envoyer l'éval par courriel"}
      />
      {factureLogId ? (
        <EmailTriggerBtn
          active={show === 'facture'}
          onClick={() => setShow(show === 'facture' ? null : 'facture')}
          label="Envoyer la facture par courriel"
        />
      ) : null}
      <EmailTriggerBtn
        active={show === 'suivi'}
        done={suiviEnvoye}
        onClick={() => setShow(show === 'suivi' ? null : 'suivi')}
        label={suiviEnvoye ? 'Renvoyer le courriel de suivi' : 'Envoyer le courriel de suivi'}
      />

      {show ? (
        <div className="rounded-2xl border border-[var(--gris-bord)] bg-[var(--gris-fond)] p-3">
          <div className="mb-2 text-[11px] text-[var(--text-secondary-60)]">
            Destinataire : <code className="font-mono">{clientCourriel}</code>
          </div>

          {gmailConnected ? (
            <div className="mb-2 flex gap-1 rounded-full bg-[rgba(0,0,0,0.10)] p-1">
              <ModePill
                active={mode === 'draft'}
                onClick={() => setMode('draft')}
                title={`Crée un brouillon dans ${gmailEmail ?? 'Gmail'} — tu vérifies + envoies manuellement`}
                icon={<FileEdit size={12} />}
                label="Brouillon Gmail"
              />
              <ModePill
                active={mode === 'send'}
                onClick={() => setMode('send')}
                title="Envoi direct via SMTP/Resend (sans relecture)"
                icon={<Send size={12} />}
                label="Envoyer maintenant"
              />
            </div>
          ) : null}

          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Message personnalisé (optionnel) — ajouté en encart au courriel."
            rows={3}
            className="input-system mb-2 font-sans"
            style={{ resize: 'vertical' }}
          />
          <button
            type="button"
            onClick={() => send(show)}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--jaune)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--jaune-h)] disabled:opacity-50"
          >
            {mode === 'draft' ? <FileEdit size={14} /> : <Send size={14} />}
            {pending
              ? mode === 'draft' ? 'Création brouillon…' : 'Envoi…'
              : mode === 'draft' ? 'Créer le brouillon Gmail' : 'Envoyer maintenant'}
          </button>
        </div>
      ) : null}

      {result?.error ? (
        <div className="flex items-center gap-1 rounded-xl border border-[var(--rouge)]/30 bg-[var(--rouge)]/10 px-3 py-1.5 text-xs text-[var(--rouge)]">
          <AlertCircle size={12} />
          {result.error}
        </div>
      ) : null}
      {result?.success ? (
        <div className="flex items-center gap-1 rounded-xl border border-[var(--st-approuve-bg)] bg-[var(--st-approuve-bg)]/30 px-3 py-1.5 text-xs text-[var(--st-approuve-fg)]">
          <CheckCircle2 size={12} />
          {result.mode === 'draft'
            ? 'Brouillon créé dans Gmail. Ouvre Gmail pour vérifier et envoyer.'
            : 'Courriel envoyé.'}
        </div>
      ) : null}
    </div>
  );
}

function EmailTriggerBtn({
  active,
  done,
  onClick,
  label,
}: {
  active: boolean;
  done?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
        active
          ? 'border-[var(--jaune-h)] bg-[var(--jaune)]/20'
          : done
            ? 'border-[var(--st-approuve-bg)] text-[var(--st-approuve-fg)] hover:bg-[var(--st-approuve-bg)]/20'
            : 'border-[var(--gris-bord)] text-[var(--text-secondary-70)] hover:border-[var(--jaune)] hover:bg-[var(--jaune)]/10'
      }`}
    >
      <Mail size={14} />
      {label}
    </button>
  );
}

function ModePill({
  active,
  onClick,
  title,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active ? 'bg-[var(--jaune)] text-black' : 'text-[var(--text-secondary-70)] hover:bg-white/40'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
