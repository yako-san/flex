import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

// /dashboard est l'URL configurée dans Clerk (NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL).
// On redirige vers /admin pour conserver le point d'entrée historique.
export default async function DashboardRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/admin`);
}
