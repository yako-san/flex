import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { getEmailTemplates } from '@/lib/email/render-template';
import { EmailTemplatesForm } from './email-templates-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function EmailTemplatesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const t = getEmailTemplates(workshop.emailTemplates);
  // Extrait les clés v1 non-mappées (préservées par transform-templates pour audit)
  const unmapped =
    (t as { _unmapped?: Record<string, string> })._unmapped ?? {};

  return (
    <div style={{ maxWidth: 880 }}>
      <Link
        href={`/${locale}/admin/settings`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Paramètres
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Templates de courriels et SMS</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Personnalise séparément FR et EN. Le client reçoit la version
        correspondant à <code>Client.lang</code>. Les fragments granulaires
        (greeting / intro / cta / outro) viennent du V1 — utilisés si tu ne
        remplis pas le champ « Corps » direct.
      </p>
      <EmailTemplatesForm initial={t} unmapped={unmapped} />
    </div>
  );
}
