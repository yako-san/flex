import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { JsonTree } from '../_components/json-tree';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

// Documentation des clés v1 connues, pour aider à comprendre ce qui est utile.
const KEY_DOCS: Record<string, string> = {
  workshop:
    'Configuration v1 du workshop : nom, infos atelier, paramètres, templates messages, équipe, branding. C\'EST ICI que se trouvent les textes de courriels v1, les SMS, les heures d\'ouverture, etc.',
  catalogue: 'Catalogue v1 brut : services, pièces, forfaits, marques. Déjà mappé dans les tables v2 mais conservé brut pour audit.',
  clients: 'Liste clients v1 brute. Déjà mappée vers Client v2.',
  velos: 'Liste vélos v1 brute. Déjà mappée vers Velo v2.',
  bdcs: 'Bons de travail v1 actifs. Déjà mappés vers Bdc v2.',
  bdcsArchives: 'BDT v1 archivés. Déjà mappés vers Bdc v2 avec archiveStatus correspondant.',
  ventes: 'Ventes directes v1 actives. Déjà mappées vers VenteDirecte v2.',
  ventesArchives: 'Ventes v1 archivées (factures). Déjà mappées vers FactureLog v2.',
  pos: 'Bons de commande fournisseurs v1. Déjà mappés vers Po v2.',
  marques: 'Marques v1. Déjà mappées vers Marque v2.',
  equipe: 'Équipe v1 (mécaniciens). Déjà mappée vers EquipeMember v2.',
  counters: 'Compteurs v1 (séquences vélo, factures). Préservés dans Counter v2.',
  appVersion: 'Version de l\'app v1 au moment du dump.',
  schemaVersion: 'Version du schema de dump.',
  exportedAt: 'Date d\'export du dump.',
};

const PRIORITY_KEYS = ['workshop', 'catalogue', 'equipe'];

export default async function LegacyV1Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const dump = workshop.legacyV1Extras as Record<string, unknown> | null;
  if (!dump) {
    return (
      <div>
        <PageHeader eyebrow="audit · dump v1" title="Données v1 brutes" />
        <div className="p-6">
          <p className="text-sm text-[var(--text-secondary-60)]">
            Aucun dump v1 stocké. Importe d&apos;abord le dump via{' '}
            <Link href={`/${locale}/admin/import`} className="text-[var(--jaune-h)] hover:underline">
              Import v1
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const allKeys = Object.keys(dump);
  const otherKeys = allKeys.filter((k) => !PRIORITY_KEYS.includes(k));

  return (
    <div>
      <PageHeader
        eyebrow="audit · legacyV1Extras"
        title="Données v1 brutes"
        subline="Dump v1 complet stocké en JSONB sur Workshop. Sert à retrouver les paramètres et textes v1 non encore portés."
      />
      <div className="mx-auto max-w-[1100px] p-6">
      <div style={statsBox}>
        <Stat label="Clés top-level" value={allKeys.length} />
        <Stat label="App version v1" value={String(dump['appVersion'] ?? '?')} />
        <Stat
          label="Schema version v1"
          value={String(dump['schemaVersion'] ?? '?')}
        />
        <Stat
          label="Exporté le"
          value={
            typeof dump['exportedAt'] === 'string' || typeof dump['exportedAt'] === 'number'
              ? new Date(dump['exportedAt'] as string | number).toLocaleString('fr-CA')
              : '?'
          }
        />
      </div>

      <h2 style={h2}>📌 Clés prioritaires (paramètres v1)</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Ce sont les sections qui contiennent typiquement les <strong>paramètres et
        textes</strong> à récupérer manuellement (templates messages, configuration
        atelier, etc.).
      </p>
      {PRIORITY_KEYS.map((k) => (
        <Section key={k} keyName={k} value={dump[k]} doc={KEY_DOCS[k]} expanded />
      ))}

      <h2 style={h2}>Autres clés (déjà mappées en v2)</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Ces données sont déjà importées dans les tables v2. Conservées brutes pour
        audit/traçabilité.
      </p>
      {otherKeys.map((k) => (
        <Section key={k} keyName={k} value={dump[k]} doc={KEY_DOCS[k]} />
      ))}
      </div>
    </div>
  );
}

function Section({
  keyName,
  value,
  doc,
  expanded,
}: {
  keyName: string;
  value: unknown;
  doc?: string | undefined;
  expanded?: boolean;
}) {
  const isObj = value !== null && typeof value === 'object';
  const count = isObj ? Object.keys(value as Record<string, unknown>).length : null;
  return (
    <details
      open={expanded ?? false}
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        padding: '0.75rem 1rem',
        marginBottom: '0.75rem',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
        <code style={{ color: '#1565c0' }}>{keyName}</code>
        {count !== null ? <span style={{ color: '#999', fontWeight: 400, marginLeft: 8 }}>({count} clés)</span> : null}
      </summary>
      {doc ? <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{doc}</p> : null}
      <div style={{ marginTop: '0.5rem', maxHeight: 600, overflow: 'auto', background: '#fafafa', padding: '0.75rem', borderRadius: 4 }}>
        <JsonTree data={value} />
      </div>
    </details>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.75rem' };
const statsBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1rem',
  background: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  padding: '1rem',
  marginBottom: '1.5rem',
};
