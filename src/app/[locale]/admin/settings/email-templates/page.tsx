import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { getEmailTemplates } from '@/lib/email/render-template';
import { PageHeader } from '@/components/ui/page-header';
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
    <div>
      <PageHeader
        eyebrow="paramètres · modèles de messages"
        title="Templates de courriels et SMS"
        subline="FR et EN séparés. Le client reçoit la version correspondant à Client.lang. Fragments granulaires V1 (greeting / intro / cta / outro) en fallback."
      />
      <div className="bloc-contenu mx-auto max-w-[880px] p-6">
        <Link
          href={`/${locale}/admin/settings`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Paramètres
        </Link>
        <EmailTemplatesForm initial={t} unmapped={unmapped} />
      </div>
    </div>
  );
}
