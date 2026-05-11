import { setRequestLocale } from 'next-intl/server';
import { UiKitContent } from '@/components/ui-kit/ui-kit-content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

/**
 * UI Kit en accès public (route ajoutée à PUBLIC_ROUTES du middleware).
 *
 * Pourquoi public ?
 *   - QA visuel sur preview Vercel sans auth Clerk (les previews n'ont
 *     pas toujours les cookies Clerk de prod).
 *   - Diagnostic isolé : si /dev/ui-kit charge mais /admin/settings/ui-kit
 *     crashe, le bug est dans AdminLayout (auth/DB), pas dans le ui-kit.
 *   - Aucune donnée sensible : c'est de la doc UI statique avec mocks.
 *
 * Une fois Sprint 4 validé, on peut décider de retirer cette route ou de
 * la garder comme entry point dev permanent.
 */
export default async function PublicUiKitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="min-h-screen bg-[var(--gris-fond)] py-6">
      <UiKitContent eyebrow="dev · public · qa visuelle" locale={locale} />
    </main>
  );
}
