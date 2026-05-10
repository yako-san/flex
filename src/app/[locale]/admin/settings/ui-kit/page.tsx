import { setRequestLocale } from 'next-intl/server';
import { UiKitContent } from '@/components/ui-kit/ui-kit-content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

/**
 * UI Kit dans Settings — visible uniquement après auth admin. Wrappe le
 * composant partagé `<UiKitContent>` (utilisé aussi par /dev/ui-kit en
 * accès public pour le debug Sprint 4).
 */
export default async function SettingsUiKitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <UiKitContent eyebrow="paramètres · ui kit" />;
}
