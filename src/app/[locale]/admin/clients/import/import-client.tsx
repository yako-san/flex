'use client';

import { useActionState, useState } from 'react';
import {
  previewClientsCsvAction,
  executeClientsImportAction,
  type ImportPreview,
  type ImportResult,
} from './actions';

const TARGET_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'prenom', label: 'Prénom', required: true },
  { key: 'nom', label: 'Nom', required: true },
  { key: 'courriel', label: 'Courriel' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'indicatif', label: 'Indicatif (+1, +33...)' },
  { key: 'lang', label: 'Langue (fr-CA, en-CA)' },
  { key: 'commPref', label: 'Comm. préférée (EMAIL, SMS, TELEPHONE, AUCUN)' },
  { key: 'lead', label: 'Source / Lead' },
  { key: 'notes', label: 'Notes' },
];

export function ImportClientsPage() {
  const [previewState, previewAction, previewPending] = useActionState<
    ImportPreview | null,
    FormData
  >(previewClientsCsvAction, null);

  const [importState, importAction, importPending] = useActionState<
    ImportResult | null,
    FormData
  >(executeClientsImportAction, null);

  return (
    <div>
      <h2 style={h2}>1. Téléverse ton fichier CSV</h2>
      <form action={previewAction} className="mb-8">
        <input
          type="file"
          name="csvFile"
          accept=".csv,text/csv"
          required
          className="mb-3"
        />
        <br />
        <button type="submit" disabled={previewPending} className="btn-primary">
          {previewPending ? 'Analyse…' : 'Analyser le CSV'}
        </button>
        {previewState?.error ? (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{previewState.error}</div>
        ) : null}
      </form>

      {previewState?.headers && previewState.headers.length > 0 ? (
        <PreviewAndImport preview={previewState} importAction={importAction} importPending={importPending} importState={importState} />
      ) : null}
    </div>
  );
}

function PreviewAndImport({
  preview,
  importAction,
  importPending,
  importState,
}: {
  preview: ImportPreview;
  importAction: (fd: FormData) => void;
  importPending: boolean;
  importState: ImportResult | null;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(preview.mapping ?? {});
  const headers = preview.headers ?? [];
  const sample = preview.sample ?? [];

  return (
    <>
      <h2 style={h2}>2. Mappe les colonnes ({preview.totalRows} lignes détectées)</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Détection automatique faite. Ajuste si nécessaire. Champs marqués * obligatoires.
      </p>

      <form action={importAction}>
        <input type="hidden" name="csvContent" value={preview.csvContent ?? ''} />

        <table style={tbl}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={th}>Champ flex</th>
              <th style={th}>Colonne CSV</th>
            </tr>
          </thead>
          <tbody>
            {TARGET_FIELDS.map((f) => (
              <tr key={f.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={td}>
                  {f.label}
                  {f.required ? <span style={{ color: '#c62828', marginLeft: 2 }}>*</span> : null}
                </td>
                <td style={td}>
                  <select
                    name={`map_${f.key}`}
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                    className="input-system"
                  >
                    <option value="">— ignorer —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ ...h2, fontSize: '1rem', marginTop: '1.5rem' }}>Aperçu (5 premières lignes)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...tbl, fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                {TARGET_FIELDS.map((f) => (
                  <th key={f.key} style={th}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {TARGET_FIELDS.map((f) => {
                    const csvHeader = mapping[f.key];
                    const v = csvHeader ? row[csvHeader] : '';
                    return (
                      <td key={f.key} style={{ ...td, color: v ? '#1a1a1a' : '#bbb' }}>
                        {v || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={h2}>3. Lance l&apos;import</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Doublons détectés sur (prénom + nom) ou courriel — ignorés sans modification.
          Fais un dry-run d&apos;abord pour vérifier les chiffres.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            name="dryRun"
            value="1"
            disabled={importPending}
            className="btn-primary"
            style={{ background: importPending ? '#999' : '#1565c0' }}
          >
            {importPending ? 'Test…' : '🧪 Dry-run (compter sans insérer)'}
          </button>
          <button
            type="submit"
            name="dryRun"
            value="0"
            disabled={importPending}
            className="btn-primary"
          >
            {importPending ? 'Import…' : '⬇️ Importer pour de vrai'}
          </button>
        </div>

        {importState?.error ? (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{importState.error}</div>
        ) : null}
        {importState && !importState.error ? (
          <div className="mt-4 rounded-xl border border-green-400 bg-green-50 p-3 text-sm text-green-800">
            ✓ {importState.inserted ?? 0} ajoutés · {importState.skipped ?? 0} ignorés (doublons){importState.errors && importState.errors.length > 0 ? ` · ${importState.errors.length} erreurs` : ''}
            {importState.errors && importState.errors.length > 0 ? (
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer' }}>Voir les erreurs</summary>
                <ul style={{ marginTop: '0.5rem' }}>
                  {importState.errors.slice(0, 50).map((e, i) => (
                    <li key={i} style={{ fontSize: '0.85rem' }}>{e}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </form>
    </>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginTop: '1.5rem', marginBottom: '0.75rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.4rem 0.6rem' };
