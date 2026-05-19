import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import {
  MailIcon,
  Building2Icon,
  UsersIcon,
  BikeIcon,
  ScanLineIcon,
  HardDriveIcon,
  CloudCogIcon,
  UploadIcon,
  AlertTriangleIcon,
  TagIcon,
} from '@/components/icons';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

type Card = {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Si true, la carte est désactivée (à venir, placeholder). */
  disabled?: boolean;
  /** Si true, marquage zone destructive (style alerte). */
  destructive?: boolean;
};

export default async function SettingsHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cards: Card[] = [
    {
      href: `/${locale}/admin/settings/email-templates`,
      icon: <MailIcon width={20} height={20} />,
      title: 'Modèles de messages',
      description: 'Templates courriels (évaluation, facture, vente) + SMS rappel et suivi.',
    },
    {
      href: `/${locale}/admin/settings/atelier`,
      icon: <Building2Icon width={20} height={20} />,
      title: 'Infos atelier',
      description: 'Logo, identité fiscale (TPS/TVQ), notifications courriel, organisation Clerk.',
    },
    {
      href: `/${locale}/admin/settings/design-system`,
      icon: <TagIcon width={20} height={20} />,
      title: 'Design system',
      description: 'Tokens éditables — couleur highlight, background dark/light, taille et couleur H1–H5.',
    },
    {
      href: `/${locale}/admin/equipe`,
      icon: <UsersIcon width={20} height={20} />,
      title: 'Équipe atelier',
      description: 'Liste des mécaniciens affichés dans les dropdowns de BDT.',
    },
    {
      href: `/${locale}/admin/marques`,
      icon: <BikeIcon width={20} height={20} />,
      title: 'Catalogue vélo',
      description: 'Marques disponibles dans les dropdowns (et leurs tailles).',
    },
    {
      href: '#',
      icon: <ScanLineIcon width={20} height={20} />,
      title: 'Historique scans',
      description: 'Log local des derniers codes-barres scannés + export CSV.',
      disabled: true,
    },
    {
      href: `/${locale}/admin/settings/atelier#google`,
      icon: <CloudCogIcon width={20} height={20} />,
      title: 'Santé APIs Google',
      description: 'Statut détaillé Sheets / Drive / Gmail / Contacts + sync forcée.',
    },
    {
      href: `/${locale}/admin/import`,
      icon: <HardDriveIcon width={20} height={20} />,
      title: 'Backup / Export',
      description: 'Snapshots BD, import dump V1, refresh partiel des nouveaux champs.',
    },
    {
      href: `/${locale}/admin/clients/import`,
      icon: <UploadIcon width={20} height={20} />,
      title: 'Import clients (CSV)',
      description: 'Import massif depuis un CSV avec détection auto des colonnes + dédoublonnage.',
    },
    {
      href: `/${locale}/admin/maintenance`,
      icon: <AlertTriangleIcon width={20} height={20} />,
      title: 'Admin — opérations destructives',
      description: 'Recalcul stock, suppression d\'un BDT par ID, consolidation des fantômes.',
      destructive: true,
    },
  ];

  return (
    <div>
      <PageHeader eyebrow="configuration de l'atelier" title="Paramètres" />

      <div className="bloc-contenu mx-auto max-w-[1100px] p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <SettingCard key={c.title} card={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingCard({ card }: { card: Card }) {
  const isLink = !card.disabled;
  const Container: React.ElementType = isLink ? Link : 'div';
  const props = isLink ? { href: card.href } : {};

  return (
    <Container
      {...(props as Record<string, unknown>)}
      className={[
        'group flex items-start gap-3 rounded-2xl border bg-white/85 px-4 py-3 shadow-sm transition-colors',
        card.disabled
          ? 'cursor-not-allowed border-[var(--gris-bord)]/50 opacity-60'
          : card.destructive
            ? 'border-[var(--rouge)]/30 hover:border-[var(--rouge)]/60 hover:bg-[var(--rouge)]/5'
            : 'border-[var(--gris-bord)] hover:border-[var(--jaune)] hover:bg-[var(--jaune)]/10',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          card.destructive ? 'bg-[var(--rouge)]/10 text-[var(--rouge)]' : 'bg-[var(--jaune)] text-black',
        ].join(' ')}
      >
        {card.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-[var(--dark)]">
          {card.title}
          {card.disabled ? (
            <span className="ml-2 rounded-full bg-[var(--gris-fond)] px-2 py-0.5 text-[10px] font-normal uppercase tracking-wider text-[var(--text-secondary-60)]">
              À venir
            </span>
          ) : null}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--text-secondary-70)]">{card.description}</p>
      </div>
    </Container>
  );
}
