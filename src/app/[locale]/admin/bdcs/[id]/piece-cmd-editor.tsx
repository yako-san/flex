'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePieceItemCmdAction } from '../actions';

type CmdStatus =
  | 'LISTEE'
  | 'ESTIMEE'
  | 'A_COMMANDER'
  | 'EN_COMMANDE'
  | 'RECU_PARTIEL'
  | 'RECUE';

const CMD_STATUS_OPTIONS: { value: CmdStatus | ''; label: string; sigle: string; color: string }[] = [
  { value: '',             label: '— non défini',  sigle: '·',  color: '#999' },
  { value: 'LISTEE',       label: 'Listée',        sigle: '...', color: '#999' },
  { value: 'ESTIMEE',      label: 'Estimée',       sigle: '—',  color: '#666' },
  { value: 'A_COMMANDER',  label: 'À commander',   sigle: '√',  color: '#1565c0' },
  { value: 'EN_COMMANDE',  label: 'En commande',   sigle: '$',  color: '#ef6c00' },
  { value: 'RECU_PARTIEL', label: 'Réception part.', sigle: '#', color: '#e53935' },
  { value: 'RECUE',        label: 'Reçue',         sigle: '@',  color: '#2e7d32' },
];

type Props = {
  itemId: string;
  cmdStatus: CmdStatus | null;
  cmdNote: string | null;
};

export function PieceCmdEditor({ itemId, cmdStatus, cmdNote }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CmdStatus | ''>(cmdStatus ?? '');
  const [note, setNote] = useState(cmdNote ?? '');

  const current = CMD_STATUS_OPTIONS.find((o) => o.value === status) ?? CMD_STATUS_OPTIONS[0];

  function save() {
    const fd = new FormData();
    fd.set('cmdStatus', status);
    fd.set('cmdNote', note);
    start(async () => {
      const r = await updatePieceItemCmdAction(itemId, fd);
      if (r.error) {
        alert(r.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={current?.label ?? ''}
        style={{
          background: current?.color,
          color: 'white',
          border: 0,
          borderRadius: 12,
          padding: '0.1rem 0.5rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'monospace',
          minWidth: 28,
        }}
      >
        {current?.sigle}
      </button>
      {cmdNote ? (
        <span title={cmdNote} style={{ color: '#888', fontSize: '0.75rem', cursor: 'help' }}>📝</span>
      ) : null}
      {open ? (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginTop: 28,
            width: 320,
          }}
        >
          <label style={lblStyle}>Statut commande</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CmdStatus | '')}
            style={selectStyle}
          >
            {CMD_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.sigle}  {o.label}
              </option>
            ))}
          </select>
          <label style={{ ...lblStyle, marginTop: '0.5rem' }}>Note fournisseur (optionnel)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex. cmd #12345 chez Babac"
            rows={2}
            style={{ ...selectStyle, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              style={{ padding: '0.35rem 0.75rem', background: 'transparent', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              style={{ padding: '0.35rem 0.9rem', background: pending ? '#999' : '#1a1a1a', color: 'white', border: 0, borderRadius: 4, cursor: pending ? 'wait' : 'pointer', fontSize: '0.85rem' }}
            >
              {pending ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const lblStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 500,
  color: '#444',
  marginBottom: '0.2rem',
};
const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  fontSize: '0.85rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
