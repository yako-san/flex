import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function EquipePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const equipe = await prisma.equipeMember.findMany({
    where: { workshopId: workshop.id },
    orderBy: [{ active: 'desc' }, { surnom: 'asc' }],
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Équipe</h1>
          <p style={{ color: '#666', margin: 0 }}>{equipe.length} membres</p>
        </div>
        <Link href={`/${locale}/admin/equipe/new`} style={btnPrimary}>+ Nouveau membre</Link>
      </div>
      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>Surnom</th>
            <th style={th}>Nom complet</th>
            <th style={th}>Rôle</th>
            <th style={th}>Courriel</th>
            <th style={th}>Téléphone</th>
            <th style={th}>Statut</th>
            <th style={{ ...th, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {equipe.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: m.active ? 1 : 0.5 }}>
              <td style={{ ...td, fontWeight: 600 }}>{m.surnom}</td>
              <td style={td}>{m.prenom} {m.nom}</td>
              <td style={td}>{m.role ?? '—'}</td>
              <td style={{ ...td, fontSize: '0.85rem' }}>{m.courriel ?? '—'}</td>
              <td style={td}>{m.telephone ? `${m.indicatif ?? ''} ${m.telephone}` : '—'}</td>
              <td style={td}>{m.active ? '✓ Actif' : '— Inactif'}</td>
              <td style={{ ...td, textAlign: 'right' }}>
                <Link href={`/${locale}/admin/equipe/${m.id}/edit`} style={linkBtn}>
                  Modifier
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#1a1a1a', color: 'white', textDecoration: 'none', borderRadius: 4, fontSize: '0.95rem' };
const linkBtn: React.CSSProperties = { color: '#1565c0', textDecoration: 'none', fontSize: '0.85rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
