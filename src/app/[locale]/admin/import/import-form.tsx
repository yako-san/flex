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
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>Fichier JSON du dump v1</span>
          <input
            type="file"
            name="dump"
            accept="application/json,.json"
            required
            disabled={pending}
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            background: pending ? '#999' : '#1a1a1a',
            color: 'white',
            border: 0,
            borderRadius: 4,
            cursor: pending ? 'wait' : 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {pending ? 'Import en cours…' : 'Lancer l’import'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '2rem' }}>
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
    <div
      style={{
        padding: '1rem',
        background: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: 4,
      }}
    >
      <h2 style={{ margin: '0 0 0.5rem', color: '#2e7d32' }}>Import réussi</h2>
      <p style={{ margin: '0 0 1rem' }}>
        Workshop créé : <code>{result.body.workshopId}</code>
      </p>
      <p style={{ margin: '0 0 0.5rem' }}>
        <strong>{result.body.skippedCount}</strong> entrées invalides ignorées (cf. logs).
      </p>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Détail des stats</summary>
        <pre style={{ fontSize: '0.85rem', overflow: 'auto', marginTop: '0.5rem' }}>
          {JSON.stringify(result.body.stats, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function ImportError({ result }: { result: Extract<ImportV1HandlerResult, { ok: false }> }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: '#ffebee',
        border: '1px solid #f44336',
        borderRadius: 4,
      }}
    >
      <h2 style={{ margin: '0 0 0.5rem', color: '#c62828' }}>
        Échec ({result.status})
      </h2>
      <p style={{ margin: '0 0 0.5rem' }}>{result.body.error}</p>
      {result.body.details ? (
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Détails</summary>
          <pre style={{ fontSize: '0.85rem', overflow: 'auto', marginTop: '0.5rem' }}>
            {JSON.stringify(result.body.details, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
