import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { LinkWorkshopForm } from '../link-workshop-form';
import { FiscalForm, type FiscalEntity } from '../fiscal-form';
import { LogoForm } from '../logo-form';
import { GmailConnectionPanel } from '../gmail-connection-panel';
import { getEmailProvider } from '@/lib/email/client';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ gmail_ok?: string; gmail_err?: string }>;
};

export default async function SettingsPage(props: Props) {
  try {
    return await renderSettings(props);
  } catch (e) {
    return renderCrash(e);
  }
}

function renderCrash(e: unknown): never | React.ReactElement {
  if (process.env['VERCEL_ENV'] !== 'preview') {
    throw e;
  }
  const err = e instanceof Error ? e : new Error(String(e));
  return (
    <main className="mx-auto max-w-[900px] p-8 font-mono">
      <h2 className="mb-2 text-red-700">SettingsPage crash (preview only)</h2>
      <p className="mb-4 text-xs text-[var(--text-secondary-60)]">
        Ce dump n&apos;apparaît qu&apos;en preview Vercel. En production, l&apos;erreur
        est masquée et capturée par l&apos;error boundary.
      </p>
      <h3>Message</h3>
      <pre className="whitespace-pre-wrap rounded-xl border border-yellow-300 bg-yellow-50 p-3">
        {err.message || '(aucun message)'}
      </pre>
      <h3>Stack</h3>
      <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--gris-bord)] bg-white/60 p-3 text-xs">
        {err.stack ?? '(aucune stack)'}
      </pre>
      <h3>Cause probable</h3>
      <p>
        Si message contient <code>column does not exist</code> ou{' '}
        <code>Unknown field</code> : la branche Neon de cette preview n&apos;a pas
        les migrations récentes. Soit redéclencher la preview après une migration
        sur main, soit vérifier l&apos;intégration Vercel-Neon (chaque preview
        crée une branche DB indépendante).
      </p>
    </main>
  );
}

async function renderSettings({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const { orgId, orgSlug } = await auth();
  const workshop = await getActiveWorkshop();

  const fiscal = (workshop?.fiscalEntity as FiscalEntity | null) ?? {};

  return (
    <div>
      <PageHeader
        eyebrow="paramètres · configuration"
        title="Infos atelier"
      />

      <div className="bloc-contenu mx-auto max-w-[800px] p-6">
        <h2 className="mb-2 mt-6 text-lg font-semibold">Logo</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
          Utilisé en haut des PDFs (évaluation, facture) et comme favicon (icône
          de l&apos;onglet du navigateur).
        </p>
        {workshop ? <LogoForm currentLogoBase64={workshop.logoBase64} /> : null}

        <h2 className="mb-2 mt-12 text-lg font-semibold">Identité fiscale</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
          Ces infos apparaissent sur les évaluations et factures émises.
          Les numéros TPS/TVQ sont obligatoires pour la facturation au Canada
          (lois LTA/LTVQ) une fois ton seuil de revenu atteint.
        </p>
        {workshop ? <FiscalForm initial={fiscal} /> : <p>Aucun workshop actif.</p>}

        <h2 className="mb-2 mt-12 text-lg font-semibold">Notifications courriel</h2>
        <div className="mb-8 rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4 text-sm">
          <Row label="Provider actif">
            {(() => {
              const p = getEmailProvider();
              if (p === 'GMAIL')
                return (
                  <span className="text-green-700">
                    ✓ Gmail SMTP — depuis <code>{process.env['GMAIL_USER']}</code>
                  </span>
                );
              if (p === 'RESEND')
                return (
                  <span className="text-green-700">
                    ✓ Resend — from{' '}
                    <code>{process.env['EMAIL_FROM'] ?? 'onboarding@resend.dev'}</code>
                  </span>
                );
              return (
                <span className="text-red-700">
                  ✕ Aucun provider configuré (GMAIL_USER+APP_PASSWORD ou
                  RESEND_API_KEY manquants)
                </span>
              );
            })()}
          </Row>
          <p className="mt-3 text-xs text-[var(--text-secondary-60)]">
            <strong>Option 1 — Gmail (recommandée si tu utilises déjà Gmail) :</strong>
            <br />
            1. Active la 2FA sur le compte Google.{' '}
            <br />
            2. Crée un App Password sur{' '}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              myaccount.google.com/apppasswords
            </a>{' '}
            (sélectionne « Mail » comme application).
            <br />
            3. Ajoute dans Vercel : <code>GMAIL_USER</code> = ton adresse Gmail, et{' '}
            <code>GMAIL_APP_PASSWORD</code> = les 16 caractères générés.
          </p>
          <p className="text-xs text-[var(--text-secondary-60)]">
            <strong>Option 2 — Resend (multi-tenant futur) :</strong> compte sur{' '}
            <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">resend.com</a>,
            API key, env <code>RESEND_API_KEY</code> + DNS du domaine.
          </p>
          <p className="mt-3">
            <Link
              href={`/${locale}/admin/settings/email-templates`}
              className="text-sm text-blue-600 hover:underline"
            >
              ✏️ Personnaliser les templates de courriels →
            </Link>
          </p>
        </div>

        <h2 className="mb-2 mt-12 text-lg font-semibold">Brouillons Gmail (mode hybride)</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
          Connecte un compte Gmail pour créer des brouillons (au lieu d&apos;envoyer
          directement). Pattern V1 — tu vérifies dans Gmail puis cliques Envoyer.
          L&apos;envoi direct via SMTP/Resend reste disponible en bouton secondaire
          sur chaque BDT.
        </p>
        <GmailConnectionPanel
          connected={!!workshop?.googleRefreshToken}
          email={workshop?.googleEmail ?? null}
          successMessage={sp.gmail_ok ?? null}
          errorMessage={sp.gmail_err ?? null}
        />

        <h2 className="mb-2 mt-12 text-lg font-semibold">Workshop et organisation Clerk</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
          En multi-tenant, chaque atelier est lié à une <strong>Clerk Organization</strong>.
        </p>

        <div className="mb-6 rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4">
          <Row label="Workshop">
            {workshop ? (
              <code>
                {workshop.name} <span className="text-[var(--text-secondary-60)]">({workshop.id})</span>
              </code>
            ) : (
              <em>aucun</em>
            )}
          </Row>
          <Row label="Workshop · clerkOrgId">
            {workshop?.clerkOrgId ? (
              <code>{workshop.clerkOrgId}</code>
            ) : (
              <em className="text-red-700">non lié</em>
            )}
          </Row>
          <Row label="Clerk Organization active">
            {orgId ? (
              <code>
                {orgSlug ?? '?'} <span className="text-[var(--text-secondary-60)]">({orgId})</span>
              </code>
            ) : (
              <em>aucune (sélectionne une org dans la sidebar)</em>
            )}
          </Row>
        </div>

        {workshop && !workshop.clerkOrgId && orgId ? (
          <LinkWorkshopForm
            workshopId={workshop.id}
            workshopName={workshop.name}
            clerkOrgId={orgId}
            clerkOrgSlug={orgSlug ?? null}
          />
        ) : null}

        {workshop?.clerkOrgId && workshop.clerkOrgId === orgId ? (
          <p className="text-green-700">✓ Workshop correctement lié à l&apos;org active.</p>
        ) : null}

        {workshop?.clerkOrgId && workshop.clerkOrgId !== orgId ? (
          <p className="text-sm text-[var(--text-secondary-60)]">
            Le workshop est lié à une autre org. Sélectionne-la dans la sidebar pour
            gérer ce workshop.
          </p>
        ) : null}

        {!workshop ? (
          <p className="text-sm text-[var(--text-secondary-60)]">
            Aucun workshop. Va dans <strong>Import v1</strong> pour charger le dump.
          </p>
        ) : null}

        <h2 className="mb-2 mt-12 text-lg font-semibold">Apparence</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
          Vitrine des composants UI Flex V2 (Sprint 4 — port look &amp; feel V1).
          Utile pour QA visuel et référence design.
        </p>
        <Link
          href={`/${locale}/admin/settings/ui-kit` as never}
          className="btn-primary"
        >
          Ouvrir le UI Kit →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5">
      <span className="w-[220px] shrink-0 text-sm text-[var(--text-secondary-60)]">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}
