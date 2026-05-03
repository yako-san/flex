import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function isValidLocale(locale: string | undefined): locale is (typeof routing.locales)[number] {
  return locale !== undefined && (routing.locales as readonly string[]).includes(locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isValidLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
