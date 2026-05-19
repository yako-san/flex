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
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10">
      {/* Spec : `docs/design-system/preview/screen-login.html` — carte
          jaune `rounded-30 padding 40/50`, ombre douce, gap 32px entre
          logo / bouton Google / caption, largeur 320px. */}
      <div
        className="flex w-[320px] max-w-full flex-col items-center"
        style={{
          background: 'var(--jaune)',
          borderRadius: 30,
          padding: '40px 50px',
          gap: 32,
          boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
        }}
      >
        {/* Logo complet FLEX/REV avec tagline localisée. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Flex"
          width={160}
          height={160}
          style={{ display: 'block', borderRadius: '50%' }}
        />

        <SignIn
          path={`/${locale}/sign-in`}
          signUpUrl={`/${locale}/sign-up`}
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-0 p-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              // Bouton OAuth Google (et autres) : pill brun spec 44h,
              // uppercase letter-spacing 0.08em, font 13pt 700.
              socialButtonsBlockButton:
                'bg-[var(--brun)] hover:bg-[var(--brun-h)] text-white rounded-full font-bold uppercase text-[13px] tracking-[0.08em] h-[44px]',
              socialButtonsBlockButtonText: 'text-white',
              formButtonPrimary:
                'bg-[var(--brun)] hover:bg-[var(--brun-h)] text-white rounded-full font-bold uppercase text-[13px] tracking-[0.08em] h-[44px]',
              formFieldInput:
                'rounded-xl border-[1.5px] border-[var(--brun)]/30 bg-white text-sm',
              footerActionLink: 'text-[var(--brun)] hover:text-[var(--brun-h)]',
              dividerLine: 'bg-[var(--brun)]/20',
              dividerText: 'text-[var(--brun)]/60 text-xs uppercase tracking-[0.06em]',
            },
            variables: {
              colorPrimary: '#806642',
              colorText: '#1a1a1a',
              borderRadius: '12px',
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            },
          }}
        />

        <p
          className="text-center"
          style={{
            fontSize: 11,
            color: 'rgba(0,0,0,0.5)',
            marginTop: -16,
          }}
        >
          {restrictText}
        </p>
      </div>
    </main>
  );
}
