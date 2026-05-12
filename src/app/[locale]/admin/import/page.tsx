import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ImportForm } from './import-form';
import { RefreshForm } from './refresh-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminImportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <PageHeader
        eyebrow="bootstrap atelier"
        title="Import dump v1"
        subline="Refresh partiel (hydrate nouveaux champs) ou import complet (crée un workshop)."
      />

      <div className="mx-auto max-w-[720px] space-y-6 p-6">
        <section className="rounded-2xl bg-white/85 p-4 shadow-sm">
          <h2 className="mb-2 text-base font-semibold">Refresh partiel</h2>
          <p className="mb-3 text-sm text-[var(--text-secondary-70)]">
            Hydrate uniquement les champs ajoutés au schema export V1 récent
            (templates emails, tailles vélo, paramètres), sans toucher aux
            entités déjà importées.
          </p>
          <RefreshForm />
        </section>

        <section className="rounded-2xl bg-white/85 p-4 shadow-sm">
          <h2 className="mb-2 text-base font-semibold">Import complet (nouveau workshop)</h2>
          <p className="mb-3 text-sm text-[var(--text-secondary-70)]">
            ⚠️ Échoue si le workshop existe déjà (slug unique). À utiliser uniquement
            pour bootstrap d&apos;un atelier qui n&apos;est jamais entré dans V2.
          </p>
          <ImportForm />
        </section>
      </div>
    </div>
  );
}
