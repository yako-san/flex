import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { getActiveWorkshop } from '@/lib/workshop';
import { sanitizeTheme, type WorkshopTheme } from '@/lib/theme/types';
import { DesignSystemForm } from './form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

// Défauts alignés sur `src/app/globals.css` — utilisés comme placeholder
// dans les inputs quand l'atelier n'a pas (encore) d'override.
const DEFAULTS: Required<Pick<WorkshopTheme,
  'jaune' | 'app-bg' | 'app-bg-light' |
  'h1-size' | 'h1-color' | 'h1-weight' |
  'h2-size' | 'h2-color' | 'h2-weight' |
  'h3-size' | 'h3-color' | 'h3-weight' |
  'h4-size' | 'h4-color' | 'h4-weight' |
  'h5-size' | 'h5-color' | 'h5-weight'
>> = {
  'jaune':        '#fff056',
  'app-bg':       '#7e7e7e',
  'app-bg-light': '#cccccc',
  'h1-size':  '3rem',     'h1-color':  '#fff056', 'h1-weight': '300',
  'h2-size':  '1.8rem',   'h2-color':  '#ffffff', 'h2-weight': '900',
  'h3-size':  '1.3rem',   'h3-color':  '#ffffff', 'h3-weight': '600',
  'h4-size':  '0.9rem',   'h4-color':  '#ffffff', 'h4-weight': '900',
  'h5-size':  '0.65rem',  'h5-color':  '#ffffff', 'h5-weight': '600',
};

export default async function DesignSystemPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  const current: WorkshopTheme = workshop ? sanitizeTheme(workshop.theme) : {};

  return (
    <div>
      <PageHeader
        eyebrow="design system"
        title="Tokens éditables"
        subline="Couleurs et typographie de base — appliquées en live à toutes les pages admin."
      />
      <div className="bloc-contenu mx-auto max-w-[900px] p-6">
        <DesignSystemForm defaults={DEFAULTS} current={current} />
      </div>
    </div>
  );
}
