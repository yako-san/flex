import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function ClientsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const where: Prisma.ClientWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { nom: { contains: trimmed, mode: 'insensitive' } },
            { prenom: { contains: trimmed, mode: 'insensitive' } },
            { courriel: { contains: trimmed, mode: 'insensitive' } },
            { telephone: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where,
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    include: { _count: { select: { velos: true } } },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Clients</h1>
          <p style={{ color: '#666', margin: 0 }}>{clients.length} client{clients.length === 1 ? '' : 's'}{trimmed ? ` (filtré: « ${trimmed} »)` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SearchBar placeholder="Nom, courriel, tél, notes…" />
          <a
            href="/api/admin/export/clients"
            style={{
              padding: '0.55rem 0.9rem',
              border: '1px solid #ccc',
              color: '#444',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.9rem',
              background: 'white',
            }}
          >
            ↓ CSV
          </a>
          <Link
            href={`/${locale}/admin/clients/import`}
            style={{
              padding: '0.55rem 0.9rem',
              border: '1px solid #ccc',
              color: '#444',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.9rem',
              background: 'white',
            }}
          >
            ↑ Import CSV
          </Link>
          <Link
            href={`/${locale}/admin/clients/new`}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#1a1a1a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.95rem',
            }}
          >
            + Nouveau client
          </Link>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Téléphone</th>
              <th style={thStyle}>Courriel</th>
              <th style={thStyle}>Lang</th>
              <th style={thStyle}>Comm. pref.</th>
              <th style={thStyle}>Lead</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Remise</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Vélos</th>
              <th style={thStyle}>Notes</th>
              <th style={thStyle}>v1 brut</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const v1 = c.legacyRawV1 as Record<string, unknown> | null;
              const dateIn = v1?.['dateIn'] as string | undefined;
              const dateOut = v1?.['dateOut'] as string | undefined;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={tdStyle}>
                    <Link
                      href={`/${locale}/admin/clients/${c.id}`}
                      style={{ color: '#1565c0', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {c.prenom} {c.nom}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    {c.telephone ? (
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {c.indicatif} {c.telephone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.85rem' }}>
                    {c.courriel ?? '—'}
                  </td>
                  <td style={tdStyle}>{c.lang}</td>
                  <td style={tdStyle}>{c.commPref}</td>
                  <td style={tdStyle}>{c.lead ?? '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {c.remiseDefault ? `${Number(c.remiseDefault)}%` : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{c._count.velos}</td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', maxWidth: 200 }}>
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={c.notes ?? ''}
                    >
                      {c.notes ?? '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {v1 ? (
                      <details>
                        <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                          {dateIn ? `In: ${dateIn}` : 'voir'}
                          {dateOut ? ` · Out: ${dateOut}` : ''}
                        </summary>
                        <pre
                          style={{
                            fontSize: '0.7rem',
                            background: '#fafafa',
                            padding: '0.5rem',
                            marginTop: '0.25rem',
                            maxWidth: 400,
                            overflow: 'auto',
                          }}
                        >
                          {JSON.stringify(v1, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.6rem',
  fontWeight: 600,
  color: '#666',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem',
  verticalAlign: 'top',
};
