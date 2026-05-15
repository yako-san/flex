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
      <div className="mb-4">
        <label className="label-system">Numéro vélo</label>
        <input
          name="veloNumero"
          type="number"
          min="1"
          defaultValue={v('veloNumero')}
          placeholder={initial ? '' : 'Auto-incrément depuis le compteur'}
          className="input-system"
          style={{ width: 200 }}
        />
        {!initial ? (
          <p style={hintStyle}>Laissé vide → numéro suivant attribué automatiquement.</p>
        ) : null}
      </div>

      <div className="mb-4">
        <label className="label-system">Client *</label>
        <select
          name="clientId"
          defaultValue={initial?.clientId ?? defaultClientId ?? ''}
          required
          className="input-system"
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

      <div className="mb-4">
        <label className="label-system">Marque</label>
        <select
          name="marqueId"
          value={selectedMarqueId}
          onChange={(e) => setSelectedMarqueId(e.target.value)}
          className="input-system"
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

      <div className="mb-4">
        <label className="label-system">Modèle</label>
        <input name="modele" defaultValue={v('modele')} className="input-system" />
      </div>

      <div style={twoColStyle}>
        <div>
          <label className="label-system">Couleur</label>
          <input name="couleur" defaultValue={v('couleur')} className="input-system" />
        </div>
        <div>
          <label className="label-system">
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
                className="input-system"
                placeholder={taillesPourMarque.join(' / ')}
              />
              <datalist id="tailles-disponibles">
                {taillesPourMarque.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          ) : (
            <input name="taille" defaultValue={v('taille')} className="input-system" />
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="label-system">N° de série</label>
        <input name="numeroSerie" defaultValue={v('numeroSerie')} className="input-system" />
      </div>

      <div className="mb-4">
        <label className="label-system">Statut *</label>
        <select name="status" defaultValue={initial?.status ?? 'RV'} className="input-system">
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
          <label className="label-system">Évaluation</label>
          <select
            name="evalMecanoId"
            defaultValue={initial?.evalMecanoId ?? ''}
            className="input-system"
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
          <label className="label-system">Mécanique</label>
          <select
            name="mecaMecanoId"
            defaultValue={initial?.mecaMecanoId ?? ''}
            className="input-system"
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
          <label className="label-system">Contrôle qualité</label>
          <select
            name="ctrlMecanoId"
            defaultValue={initial?.ctrlMecanoId ?? ''}
            className="input-system"
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
      <div className="mb-4">
        <label className="label-system">Note vélo (interne)</label>
        <textarea
          name="noteVelo"
          defaultValue={v('noteVelo')}
          rows={2}
          className="input-system"
        />
      </div>
      <div className="mb-4">
        <label className="label-system">Notes libres</label>
        <textarea
          name="notes"
          defaultValue={v('notes')}
          rows={3}
          className="input-system"
        />
      </div>

      {state?.error ? (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary">
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
  return <div className="mt-1 text-xs text-red-600">{msg}</div>;
}

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
