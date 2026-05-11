import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InventaireIndexRedirect({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/admin/bdcs`);
}
