import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { LinkWorkshopForm } from './link-workshop-form';
import { FiscalForm, type FiscalEntity } from './fiscal-form';
import { LogoForm } from './logo-form';
import { GmailConnectionPanel } from './gmail-connection-panel';
import { getEmailProvider } from '@/lib/email/client';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ gmail_ok?: string; gmail_err?: string }>;
};

export default async function SettingsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const { orgId, orgSlug } = await auth();
  const workshop = await getActiveWorkshop();

  const fiscal = (workshop?.fiscalEntity as FiscalEntity | null) ?? {};

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Paramètres</h1>

      <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.5rem' }}>
        Logo
      </h2>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Utilisé en haut des PDFs (évaluation, facture) et comme favicon (icône
        de l&apos;onglet du navigateur).
      </p>
      {workshop ? <LogoForm currentLogoBase64={workshop.logoBase64} /> : null}

      <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '0.5rem' }}>
        Identité fiscale
      </h2>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Ces infos apparaissent sur les évaluations et factures émises.
        Les numéros TPS/TVQ sont obligatoires pour la facturation au Canada
        (lois LTA/LTVQ) une fois ton seuil de revenu atteint.
      </p>
      {workshop ? <FiscalForm initial={fiscal} /> : <p>Aucun workshop actif.</p>}

      <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '0.5rem' }}>
        Notifications courriel
      </h2>
      <div
        style={{
          background: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          padding: '1rem 1.25rem',
          fontSize: '0.9rem',
          marginBottom: '2rem',
        }}
      >
        <Row label="Provider actif">
          {(() => {
            const p = getEmailProvider();
            if (p === 'GMAIL')
              return (
                <span style={{ color: '#2e7d32' }}>
                  ✓ Gmail SMTP — depuis <code>{process.env['GMAIL_USER']}</code>
                </span>
              );
            if (p === 'RESEND')
              return (
                <span style={{ color: '#2e7d32' }}>
                  ✓ Resend — from{' '}
                  <code>{process.env['EMAIL_FROM'] ?? 'onboarding@resend.dev'}</code>
                </span>
              );
            return (
              <span style={{ color: '#c62828' }}>
                ✕ Aucun provider configuré (GMAIL_USER+APP_PASSWORD ou
                RESEND_API_KEY manquants)
              </span>
            );
          })()}
        </Row>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          <strong>Option 1 — Gmail (recommandée si tu utilises déjà Gmail) :</strong>
          <br />
          1. Active la 2FA sur le compte Google.{' '}
          <br />
          2. Crée un App Password sur{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noreferrer"
          >
            myaccount.google.com/apppasswords
          </a>{' '}
          (sélectionne « Mail » comme application).
          <br />
          3. Ajoute dans Vercel : <code>GMAIL_USER</code> = ton adresse Gmail, et{' '}
          <code>GMAIL_APP_PASSWORD</code> = les 16 caractères générés.
        </p>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          <strong>Option 2 — Resend (multi-tenant futur) :</strong> compte sur{' '}
          <a href="https://resend.com" target="_blank" rel="noreferrer">resend.com</a>,
          API key, env <code>RESEND_API_KEY</code> + DNS du domaine.
        </p>
        <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          <Link
            href={`/${locale}/admin/settings/email-templates`}
            style={{ color: '#1565c0', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            ✏️ Personnaliser les templates de courriels →
          </Link>
        </p>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '0.5rem' }}>
        Brouillons Gmail (mode hybride)
      </h2>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
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

      <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '0.5rem' }}>
        Workshop et organisation Clerk
      </h2>
      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        En multi-tenant, chaque atelier est lié à une <strong>Clerk Organization</strong>.
      </p>

      <div
        style={{
          background: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <Row label="Workshop">
          {workshop ? (
            <code>
              {workshop.name} <span style={{ color: '#888' }}>({workshop.id})</span>
            </code>
          ) : (
            <em>aucun</em>
          )}
        </Row>
        <Row label="Workshop · clerkOrgId">
          {workshop?.clerkOrgId ? (
            <code>{workshop.clerkOrgId}</code>
          ) : (
            <em style={{ color: '#c62828' }}>non lié</em>
          )}
        </Row>
        <Row label="Clerk Organization active">
          {orgId ? (
            <code>
              {orgSlug ?? '?'} <span style={{ color: '#888' }}>({orgId})</span>
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
        <p style={{ color: '#2e7d32' }}>✓ Workshop correctement lié à l&apos;org active.</p>
      ) : null}

      {workshop?.clerkOrgId && workshop.clerkOrgId !== orgId ? (
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Le workshop est lié à une autre org. Sélectionne-la dans la sidebar pour
          gérer ce workshop.
        </p>
      ) : null}

      {!workshop ? (
        <p style={{ color: '#666' }}>
          Aucun workshop. Va dans <strong>Import v1</strong> pour charger le dump.
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0' }}>
      <span style={{ width: 220, color: '#666', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontSize: '0.95rem' }}>{children}</span>
    </div>
  );
}
