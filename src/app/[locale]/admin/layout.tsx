import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const navItems = [
  { href: 'admin', label: 'Tableau de bord' },
  { href: 'admin/clients', label: 'Clients' },
  { href: 'admin/velos', label: 'Vélos' },
  { href: 'admin/bdcs', label: 'Bons de commande' },
  { href: 'admin/import', label: 'Import v1' },
];

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);

  // Récupère le 1er workshop (multi-tenant à venir via Clerk Organizations).
  const workshop = await prisma.workshop.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <aside
        style={{
          background: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Flex</div>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {workshop?.name ?? 'Aucun workshop'}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 4,
                textDecoration: 'none',
                color: '#1a1a1a',
                fontSize: '0.95rem',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <UserButton />
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Mon compte</span>
        </div>
      </aside>

      <main style={{ padding: '2rem 2.5rem', overflow: 'auto' }}>{children}</main>
    </div>
  );
}
