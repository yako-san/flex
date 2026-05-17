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
      <h2 className="mb-3 mt-6 text-base font-semibold">1. Téléverse ton fichier CSV</h2>
      <form action={previewAction} className="mb-8">
        <input
          type="file"
          name="csvFile"
          accept=".csv,text/csv"
          required
          className="input-system mb-3"
        />
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
      <h2 className="mb-3 mt-6 text-base font-semibold">2. Mappe les colonnes ({preview.totalRows} lignes détectées)</h2>
      <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
        Détection automatique faite. Ajuste si nécessaire. Champs marqués * obligatoires.
      </p>

      <form action={importAction}>
        <input type="hidden" name="csvContent" value={preview.csvContent ?? ''} />

        <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              <tr>
                <th className="px-3 py-2 text-left">Champ flex</th>
                <th className="px-3 py-2 text-left">Colonne CSV</th>
              </tr>
            </thead>
            <tbody>
              {TARGET_FIELDS.map((f) => (
                <tr key={f.key} className="border-t border-[var(--gris-bord)]/30">
                  <td className="px-3 py-2">
                    {f.label}
                    {f.required ? <span className="ml-0.5 text-red-600">*</span> : null}
                  </td>
                  <td className="px-3 py-2">
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
        </div>

        <h3 className="mb-3 mt-6 text-sm font-semibold">Aperçu (5 premières lignes)</h3>
        <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              <tr>
                {TARGET_FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-left">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr key={i} className="border-t border-[var(--gris-bord)]/30">
                  {TARGET_FIELDS.map((f) => {
                    const csvHeader = mapping[f.key];
                    const v = csvHeader ? row[csvHeader] : '';
                    return (
                      <td key={f.key} className={`px-3 py-2 ${v ? '' : 'text-[var(--text-secondary-50)]'}`}>
                        {v || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-6 text-base font-semibold">3. Lance l&apos;import</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
          Doublons détectés sur (prénom + nom) ou courriel — ignorés sans modification.
          Fais un dry-run d&apos;abord pour vérifier les chiffres.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            name="dryRun"
            value="1"
            disabled={importPending}
            className="btn-secondary"
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
              <details className="mt-2">
                <summary className="cursor-pointer">Voir les erreurs</summary>
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {importState.errors.slice(0, 50).map((e, i) => (
                    <li key={i}>{e}</li>
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
