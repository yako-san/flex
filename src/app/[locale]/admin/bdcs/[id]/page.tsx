import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function LegacyBdcRedirect({ params }: Props) {
  const { locale, id } = await params;
  permanentRedirect(`/${locale}/admin/inventaire/${id}`);
}
