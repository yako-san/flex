'use client';

import { useState } from 'react';

type Props = { data: unknown; defaultExpanded?: boolean };

export function JsonTree({ data, defaultExpanded = false }: Props) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}>
      <Node value={data} depth={0} forceExpanded={defaultExpanded} keyName={null} />
    </div>
  );
}

function Node({
  value,
  depth,
  forceExpanded,
  keyName,
}: {
  value: unknown;
  depth: number;
  forceExpanded: boolean;
  keyName: string | null;
}) {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  // Auto-expanded jusqu'à profondeur 1
  const initial = forceExpanded || depth < 1;
  const [expanded, setExpanded] = useState(initial);

  if (!isObject) {
    return <ScalarValue value={value} />;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const itemCount = entries.length;
  const summary = isArray ? `[ ${itemCount} ]` : `{ ${itemCount} }`;

  if (itemCount === 0) {
    return <span style={{ color: '#999' }}>{isArray ? '[]' : '{}'}</span>;
  }

  return (
    <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'transparent',
          border: 0,
          color: '#666',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {expanded ? '▾' : '▸'} <span style={{ color: '#999' }}>{summary}</span>
      </button>
      {expanded ? (
        <div style={{ marginLeft: '1.25rem', borderLeft: '1px dashed #e0e0e0', paddingLeft: '0.75rem' }}>
          {entries.map(([k, v], i) => (
            <div key={`${keyName ?? ''}-${k}-${i}`} style={{ padding: '1px 0' }}>
              <span style={{ color: '#1565c0' }}>{isArray ? `[${k}]` : k}</span>
              <span style={{ color: '#999' }}>:</span>{' '}
              <Node value={v} depth={depth + 1} forceExpanded={forceExpanded} keyName={k} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScalarValue({ value }: { value: unknown }) {
  if (value === null) return <span style={{ color: '#999' }}>null</span>;
  if (value === undefined) return <span style={{ color: '#999' }}>undefined</span>;
  if (typeof value === 'string') {
    return (
      <span style={{ color: '#2e7d32', whiteSpace: 'pre-wrap' }}>
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === 'number') return <span style={{ color: '#ef6c00' }}>{value}</span>;
  if (typeof value === 'boolean') return <span style={{ color: '#6a1b9a' }}>{String(value)}</span>;
  return <span>{String(value)}</span>;
}
