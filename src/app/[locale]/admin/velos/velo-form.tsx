'use client';

import { useActionState, useState } from 'react';
import {
  createVeloAction,
  updateVeloAction,
  type VeloFormState,
} from './actions';
import type { Velo } from '@prisma/client';

type ClientOption = { id: string; prenom: string; nom: string };
type MarqueOption = { id: string; nom: string; taillesDisponibles: string[] };
type EquipeOption = { id: string; surnom: string };

type Props = {
  initial?: Velo;
  defaultClientId?: string | null;
  clients: ClientOption[];
  marques: MarqueOption[];
  equipe: EquipeOption[];
};

const STATUSES: { value: string; label: string }[] = [
  { value: 'RV', label: 'RV (rendez-vous)' },
  { value: 'RECU', label: 'Reçu' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EVAL', label: 'Évaluation' },
  { value: 'APPROUVE', label: 'Approuvé' },
  { value: 'ON_BENCH', label: 'On bench (sur banc)' },
  { value: 'CTRL_QLTE', label: 'Contrôle qualité' },
  { value: 'FINI', label: 'Fini' },
  { value: 'LIVRE', label: 'Livré' },
  { value: 'FACTURER', label: 'À facturer' },
  { value: 'FACTURE', label: 'Facturé' },
];

export function VeloForm({ initial, defaultClientId, clients, marques, equipe }: Props) {
  const action = initial
    ? updateVeloAction.bind(null, initial.id)
    : createVeloAction;
  const [state, formAction, pending] = useActionState<VeloFormState | null, FormData>(
    action,
    null,
  );

  const fe = state?.fieldErrors ?? {};

  const [selectedMarqueId, setSelectedMarqueId] = useState<string>(
    initial?.marqueId ?? '',
  );
  const taillesPourMarque =
    marques.find((m) => m.id === selectedMarqueId)?.taillesDisponibles ?? [];
  const v = (k: keyof Velo): string =>
    initial && (initial[k] as unknown as string | number | null | undefined) != null
      ? String(initial[k])
      : '';

  return (
    <form action={formAction} style={{ maxWidth: 720 }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Numéro vélo</label>
        <input
          name="veloNumero"
          type="number"
          min="1"
          defaultValue={v('veloNumero')}
          placeholder={initial ? '' : 'Auto-incrément depuis le compteur'}
          style={{ ...inputStyle, width: 200 }}
        />
        {!initial ? (
          <p style={hintStyle}>Laissé vide → numéro suivant attribué automatiquement.</p>
        ) : null}
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Client *</label>
        <select
          name="clientId"
          defaultValue={initial?.clientId ?? defaultClientId ?? ''}
          required
          style={inputStyle}
        >
          <option value="">— sélectionner un client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom}
            </option>
          ))}
        </select>
        {fe.clientId ? <Err msg={fe.clientId} /> : null}
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Marque</label>
        <select
          name="marqueId"
          value={selectedMarqueId}
          onChange={(e) => setSelectedMarqueId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— aucune —</option>
          {marques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
              {m.taillesDisponibles.length > 0 ? ` (${m.taillesDisponibles.length} tailles)` : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Modèle</label>
        <input name="modele" defaultValue={v('modele')} style={inputStyle} />
      </div>

      <div style={twoColStyle}>
        <div>
          <label style={labelStyle}>Couleur</label>
          <input name="couleur" defaultValue={v('couleur')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>
            Taille
            {taillesPourMarque.length > 0 ? (
              <span style={{ color: '#888', fontWeight: 400, marginLeft: 4 }}>
                (suggestions de la marque)
              </span>
            ) : null}
          </label>
          {taillesPourMarque.length > 0 ? (
            <>
              <input
                name="taille"
                list="tailles-disponibles"
                defaultValue={v('taille')}
                style={inputStyle}
                placeholder={taillesPourMarque.join(' / ')}
              />
              <datalist id="tailles-disponibles">
                {taillesPourMarque.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          ) : (
            <input name="taille" defaultValue={v('taille')} style={inputStyle} />
          )}
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>N° de série</label>
        <input name="numeroSerie" defaultValue={v('numeroSerie')} style={inputStyle} />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Statut *</label>
        <select name="status" defaultValue={initial?.status ?? 'RV'} style={inputStyle}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <h3 style={h3Style}>Mécaniciens assignés</h3>
      <div style={threeColStyle}>
        <div>
          <label style={labelStyle}>Évaluation</label>
          <select
            name="evalMecanoId"
            defaultValue={initial?.evalMecanoId ?? ''}
            style={inputStyle}
          >
            <option value="">— aucun —</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>
                {e.surnom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Mécanique</label>
          <select
            name="mecaMecanoId"
            defaultValue={initial?.mecaMecanoId ?? ''}
            style={inputStyle}
          >
            <option value="">— aucun —</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>
                {e.surnom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Contrôle qualité</label>
          <select
            name="ctrlMecanoId"
            defaultValue={initial?.ctrlMecanoId ?? ''}
            style={inputStyle}
          >
            <option value="">— aucun —</option>
            {equipe.map((e) => (
              <option key={e.id} value={e.id}>
                {e.surnom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 style={h3Style}>Notes</h3>
      <div style={rowStyle}>
        <label style={labelStyle}>Note vélo (interne)</label>
        <textarea
          name="noteVelo"
          defaultValue={v('noteVelo')}
          rows={2}
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Notes libres</label>
        <textarea
          name="notes"
          defaultValue={v('notes')}
          rows={3}
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {state?.error ? (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #f44336',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: 4,
            marginBottom: '1rem',
          }}
        >
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} style={btnStyle(pending)}>
        {pending
          ? initial
            ? 'Mise à jour…'
            : 'Création…'
          : initial
          ? 'Enregistrer'
          : 'Créer le vélo'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '0.25rem' }}>{msg}</div>;
}

const rowStyle: React.CSSProperties = { marginBottom: '1rem' };
const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
};
const threeColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#444',
  marginBottom: '0.3rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
const hintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#888',
  margin: '0.25rem 0 0',
};
const h3Style: React.CSSProperties = {
  fontSize: '1rem',
  marginTop: '1.5rem',
  marginBottom: '0.75rem',
  color: '#333',
};
const btnStyle = (pending: boolean): React.CSSProperties => ({
  padding: '0.7rem 1.5rem',
  fontSize: '0.95rem',
  background: pending ? '#999' : '#1a1a1a',
  color: 'white',
  border: 0,
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
});
