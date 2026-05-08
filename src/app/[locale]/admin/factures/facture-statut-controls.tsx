'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setFactureStatutAction } from './actions';

type Statut = 'EMIS' | 'PAYE' | 'ANNULE';
type ModePaiement = 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE';

const STATUT_COLOR: Record<Statut, { bg: string; fg: string; label: string }> = {
  EMIS:   { bg: '#fff3e0', fg: '#e65100', label: 'Émise' },
  PAYE:   { bg: '#e8f5e9', fg: '#1b5e20', label: 'Payée' },
  ANNULE: { bg: '#ffebee', fg: '#c62828', label: 'Annulée' },
};

type Props = {
  factureLogId: string;
  statut: Statut;
  modePaiement: ModePaiement | null;
};

export function FactureStatutControls({ factureLogId, statut, modePaiement }: Props) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const c = STATUT_COLOR[statut];

  function update(newStatut: Statut, newMode?: ModePaiement) {
    start(async () => {
      const r = await setFactureStatutAction(
        factureLogId,
        newStatut,
        newMode ?? modePaiement ?? null,
      );
      if (r.error) alert(r.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        title="Cliquer pour changer le statut"
        style={{
          background: c.bg,
          color: c.fg,
          padding: '0.2rem 0.6rem',
          borderRadius: 12,
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: pending ? 'wait' : 'pointer',
          border: 0,
        }}
      >
        {c.label}
        {statut === 'PAYE' && modePaiement ? (
          <span style={{ marginLeft: 4, opacity: 0.7, fontWeight: 400 }}>
            ({modePaiement.toLowerCase()})
          </span>
        ) : null}
        <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>▾</span>
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 10,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '0.5rem',
            minWidth: 200,
          }}
        >
          {statut !== 'EMIS' ? (
            <button type="button" onClick={() => update('EMIS')} disabled={pending} style={btnStyle}>
              Marquer émise (non payée)
            </button>
          ) : null}
          {statut !== 'PAYE' ? (
            <>
              <div style={{ fontSize: '0.78rem', color: '#666', padding: '0.25rem 0.5rem' }}>
                Marquer payée — mode :
              </div>
              {(['COMPTANT', 'INTERAC', 'CARTE', 'AUTRE'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update('PAYE', m)}
                  disabled={pending}
                  style={btnStyle}
                >
                  ✓ {m.toLowerCase()}
                </button>
              ))}
            </>
          ) : null}
          {statut !== 'ANNULE' ? (
            <button
              type="button"
              onClick={() => {
                if (!confirm('Marquer cette facture comme annulée ?')) return;
                update('ANNULE');
              }}
              disabled={pending}
              style={{ ...btnStyle, color: '#c62828' }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '0.35rem 0.5rem',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  fontSize: '0.85rem',
  borderRadius: 4,
};
