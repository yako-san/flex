'use client';

import { useActionState } from 'react';
import { importDumpAction } from './actions';
import type { ImportV1HandlerResult } from '@/lib/import/import-v1-handler';

export function ImportForm() {
  const [result, action, pending] = useActionState<ImportV1HandlerResult | null, FormData>(
    importDumpAction,
    null,
  );

  return (
    <>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="label-system">Fichier JSON du dump v1</span>
          <input
            type="file"
            name="dump"
            accept="application/json,.json"
            required
            disabled={pending}
            className="input-system"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? 'Import en cours…' : 'Lancer l\'import'}
        </button>
      </form>

      {result && (
        <div className="mt-8">
          {result.ok ? (
            <ImportSuccess result={result} />
          ) : (
            <ImportError result={result} />
          )}
        </div>
      )}
    </>
  );
}

function ImportSuccess({ result }: { result: Extract<ImportV1HandlerResult, { ok: true }> }) {
  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-4">
      <h2 className="mb-2 font-semibold text-green-800">Import réussi</h2>
      <p className="mb-4">
        Workshop créé : <code>{result.body.workshopId}</code>
      </p>
      <p className="mb-2">
        <strong>{result.body.skippedCount}</strong> entrées invalides ignorées (cf. logs).
      </p>
      <details>
        <summary className="cursor-pointer font-medium">Détail des stats</summary>
        <pre className="mt-2 overflow-auto text-sm">
          {JSON.stringify(result.body.stats, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function ImportError({ result }: { result: Extract<ImportV1HandlerResult, { ok: false }> }) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4">
      <h2 className="mb-2 font-semibold text-red-700">
        Échec ({result.status})
      </h2>
      <p className="mb-2">{result.body.error}</p>
      {result.body.details ? (
        <details>
          <summary className="cursor-pointer font-medium">Détails</summary>
          <pre className="mt-2 overflow-auto text-sm">
            {JSON.stringify(result.body.details, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
