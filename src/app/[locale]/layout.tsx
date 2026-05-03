import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { routing } from '../../i18n/routing';

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
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );

  if (!clerkKey) return content;
  return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
}
