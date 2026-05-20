import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { getActiveWorkshop } from '@/lib/workshop';
import { sanitizeTheme, type WorkshopTheme } from '@/lib/theme/types';
import { TokensEditorClient } from './tokens-editor-client';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

/**
 * Défauts utilisés comme valeur initiale dans l'éditeur quand le tenant
 * n'a rien personnalisé. Doit rester aligné sur les valeurs de
 * `src/app/globals.css` (sinon le formulaire pré-rempli mentirait).
 */
const DEFAULTS: Required<Pick<WorkshopTheme,
  'jaune' | 'brun' | 'vert' | 'rouge' | 'dark' |
  'h1-size' | 'h1-weight' | 'h1-caps' | 'h1-color' |
  'h2-size' | 'h2-weight' | 'h2-caps' | 'h2-color' |
  'h3-size' | 'h3-weight' | 'h3-caps' | 'h3-color' |
  'h4-size' | 'h4-weight' | 'h4-caps' | 'h4-color' |
  'h5-size' | 'h5-weight' | 'h5-caps' | 'h5-color' |
  'app-bg' | 'app-bg-light' | 'overlay-step' |
  'btn-radius' | 'btn-h-sm' | 'btn-h-md' | 'btn-h-lg' | 'btn-font-size' | 'btn-line-height'
>> = {
  jaune: '#fff056', brun: '#806642', vert: '#62e335', rouge: '#d92020', dark: '#1a1a1a',
  'h1-size': '50px', 'h1-weight': '300', 'h1-caps': 'none',       'h1-color': '#fff056',
  'h2-size': '29px', 'h2-weight': '900', 'h2-caps': 'none',       'h2-color': '#1a1a1a',
  'h3-size': '21px', 'h3-weight': '600', 'h3-caps': 'none',       'h3-color': '#1a1a1a',
  'h4-size': '14px', 'h4-weight': '900', 'h4-caps': 'uppercase',  'h4-color': '#1a1a1a',
  'h5-size': '11px', 'h5-weight': '600', 'h5-caps': 'lowercase',  'h5-color': '#999999',
  'app-bg': '#7e7e7e', 'app-bg-light': '#cccccc', 'overlay-step': '0.20',
  'btn-radius': '30px', 'btn-h-sm': '32px', 'btn-h-md': '38px', 'btn-h-lg': '44px',
  'btn-font-size': '14px', 'btn-line-height': '1',
};

export default async function TokensPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  const current: WorkshopTheme = workshop ? sanitizeTheme(workshop.theme) : {};

  return (
    <div>
      <PageHeader
        eyebrow="paramètres · avancé"
        title="Tokens éditables"
        subline="Édite les valeurs de design system du workshop. Survives le reload."
      />
      <div className="bloc-contenu mx-auto max-w-[1400px] p-6">
        <TokensEditorClient defaults={DEFAULTS} initial={current} />
      </div>
    </div>
  );
}
