import { SignIn } from '@clerk/nextjs';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Page de connexion V1-fidèle (capture `0-login.png`).
 *
 * Composition V1 :
 * - Fond `--app-bg` (#929292)
 * - Pill jaune arrondie centrée, ombre douce
 * - Logo FLEX rond complet (brun + texte jaune « FLEX:/REV » + tagline
 *   localisée). Utilise le SVG correspondant à la locale (fr/en).
 * - Composant `<SignIn />` Clerk customisé via `appearance` pour matcher
 *   les tokens V1 (couleur primaire brun, bouton pill arrondi, etc.)
 * - Footer texte « Accès restreint aux membres de l'atelier. »
 */
export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Logo localisé : fr-CA → SVG FR, en-CA → SVG EN, fallback FR.
  const logoSrc = locale.startsWith('en')
    ? '/logo/flex-rond-en.svg'
    : '/logo/flex-rond-fr.svg';
  const restrictText = locale.startsWith('en')
    ? 'Restricted to workshop members.'
    : 'Accès restreint aux membres de l\'atelier.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-8">
      <div
        className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[40px] bg-[var(--jaune)] p-8"
        style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}
      >
        {/* Logo complet FLEX/REV avec tagline localisée. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Flex"
          width={160}
          height={160}
          style={{ display: 'block' }}
        />

        <SignIn
          path={`/${locale}/sign-in`}
          signUpUrl={`/${locale}/sign-up`}
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'bg-[var(--brun)] hover:bg-[var(--brun-h)] text-white rounded-full font-semibold uppercase tracking-wider text-xs',
              formButtonPrimary:
                'bg-[var(--brun)] hover:bg-[var(--brun-h)] text-white rounded-full font-semibold uppercase tracking-wider text-xs',
              formFieldInput:
                'rounded-xl border-[1.5px] border-[var(--brun)]/30 bg-white text-sm',
              footerActionLink: 'text-[var(--brun)] hover:text-[var(--brun-h)]',
              dividerLine: 'bg-[var(--brun)]/20',
              dividerText: 'text-[var(--brun)]/60 text-xs',
            },
            variables: {
              colorPrimary: '#806642',
              colorText: '#1a1a1a',
              borderRadius: '12px',
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            },
          }}
        />

        <p className="mt-2 text-center text-[11px] italic text-[var(--brun)]/70">
          {restrictText}
        </p>
      </div>
    </main>
  );
}
