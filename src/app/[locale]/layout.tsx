import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ConfirmDialogHost } from '../../components/ui/confirm-dialog';
import { Toaster } from '../../components/ui/sonner';
import { routing } from '../../i18n/routing';
import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  // ClerkProvider conditionnel : permet au build de passer pendant le bootstrap
  // tant que les clés Clerk ne sont pas configurées dans .env. Une fois la
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY définie, l'auth devient active.
  const clerkKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const content = (
    <html lang={locale}>
      <head>
        {/* Init du theme dark/light AVANT le first paint pour éviter le
            flash. Lit `flex-theme` depuis localStorage, ajoute la classe
            `light-mode` au body si nécessaire. Inline pour exécution
            synchrone, blocking. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('flex-theme');if(t==='light')document.documentElement.classList.add('flex-theme-pre-light');}catch(e){}`,
          }}
        />
      </head>
      <body className="flex-theme-body">
        <NextIntlClientProvider messages={messages}>
          {children}
          <ConfirmDialogHost />
          <Toaster />
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(document.documentElement.classList.contains('flex-theme-pre-light'))document.body.classList.add('light-mode');}catch(e){}`,
          }}
        />
      </body>
    </html>
  );

  if (!clerkKey) return content;
  return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
}
