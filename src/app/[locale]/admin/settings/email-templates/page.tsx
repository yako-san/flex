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
  const initial = {
    evalSubject: t.eval?.subject ?? '',
    evalBody: t.eval?.body ?? '',
    factureSubject: t.facture?.subject ?? '',
    factureBody: t.facture?.body ?? '',
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Link
        href={`/${locale}/admin/settings`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Paramètres
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Templates de courriels</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Personnalise le sujet et le corps des courriels d&apos;évaluation et de facture.
      </p>
      <EmailTemplatesForm initial={initial} />
    </div>
  );
}
