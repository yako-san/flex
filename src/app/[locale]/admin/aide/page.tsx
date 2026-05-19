import { setRequestLocale } from 'next-intl/server';
import {
  InboxIcon,
  ClipboardCheckIcon,
  WrenchIcon,
  LayoutDashboardIcon,
  WorkflowIcon,
  ListChecksIcon,
  LayersIcon,
  SmartphoneIcon,
  BanknoteIcon,
  QrCodeIcon,
  ReceiptIcon,
} from '@/components/icons';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

type Tutoriel = {
  num: string;
  title: string;
  icon: React.ReactNode;
  blurb: string;
};

type Section = {
  label: string;
  tutoriels: Tutoriel[];
};

const SECTIONS: Section[] = [
  {
    label: 'Bons de travail',
    tutoriels: [
      {
        num: '01',
        title: 'Recevoir un vélo',
        icon: <InboxIcon width={22} height={22} />,
        blurb: 'Créer un BDT, lier client + vélo (existant ou nouveau), choisir le sigle initial.',
      },
      {
        num: '02',
        title: 'Évaluer un vélo',
        icon: <ClipboardCheckIcon width={22} height={22} />,
        blurb: 'Ajouter services + pièces, valider la liste, envoyer l\'évaluation par courriel au client.',
      },
      {
        num: '03',
        title: 'Réparer un vélo',
        icon: <WrenchIcon width={22} height={22} />,
        blurb: 'Cocher les sous-tâches forfait, ajuster prix, mettre les pièces en commande.',
      },
    ],
  },
  {
    label: 'Flux de travail',
    tutoriels: [
      {
        num: '04',
        title: 'Dashboard',
        icon: <LayoutDashboardIcon width={22} height={22} />,
        blurb: 'Vue d\'ensemble : KPI atelier, BDT actifs, stock à commander, dernières factures et ventes.',
      },
      {
        num: '05',
        title: 'WorkflowIcon : Bon de Travail',
        icon: <WorkflowIcon width={22} height={22} />,
        blurb: 'RV → REÇU → ÉVAL. → APPROUVÉ → ON BENCH → CTRL QLTÉ → FACTURER → FACTURÉ → LIVRÉ.',
      },
      {
        num: '06',
        title: 'Statut : Bon de Travail',
        icon: <ListChecksIcon width={22} height={22} />,
        blurb: 'Couleurs de fond selon statut, pills mécaniciens, checkboxes avancement.',
      },
    ],
  },
  {
    label: 'Services + pièces',
    tutoriels: [
      {
        num: '07',
        title: 'Services + pièces',
        icon: <LayersIcon width={22} height={22} />,
        blurb: 'Catalogue services à la carte, forfaits avec sous-tâches, pièces en stock vs à commander.',
      },
      {
        num: '08',
        title: 'Inventaire mobile',
        icon: <SmartphoneIcon width={22} height={22} />,
        blurb: 'Consulter et ajuster le stock depuis le téléphone (à venir).',
      },
      {
        num: '09',
        title: 'Vente rapide POS',
        icon: <BanknoteIcon width={22} height={22} />,
        blurb: 'Créer une vente au comptoir (walk-in), ajouter items, encaisser en un clic.',
      },
      {
        num: '10',
        title: 'Scanner code-barre',
        icon: <QrCodeIcon width={22} height={22} />,
        blurb: 'Scanner les pièces à la réception ou à la vente pour gain de temps.',
      },
      {
        num: '11',
        title: 'Facturation & taxes',
        icon: <ReceiptIcon width={22} height={22} />,
        blurb: 'TPS 5 % + TVQ 9,975 % calculés sur le sous-total HT. Acompte affiché en « reste à payer ».',
      },
    ],
  },
];

type Props = { params: Promise<{ locale: string }> };

export default async function AidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <PageHeader
        eyebrow="centre d'aide"
        title="Aide"
        subline="Tutoriels pas-à-pas pour les flux essentiels de l'atelier."
      />

      <div className="bloc-contenu mx-auto max-w-[1200px] p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {SECTIONS.map((sec) => (
            <section key={sec.label}>
              <h2 className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--jaune)]">
                {sec.label}
              </h2>
              <div className="space-y-2">
                {sec.tutoriels.map((t) => (
                  <TutorielCard key={t.num} t={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function TutorielCard({ t }: { t: Tutoriel }) {
  return (
    <article className="flex gap-3 rounded-2xl bg-white/85 p-3 shadow-sm transition-colors hover:bg-white">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jaune)] text-black">
          {t.icon}
        </span>
        <span className="font-mono text-[10px] font-semibold text-[var(--text-secondary-60)]">{t.num}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--dark)]">{t.title}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary-70)]">{t.blurb}</p>
      </div>
    </article>
  );
}
