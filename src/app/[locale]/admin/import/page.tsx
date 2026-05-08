import { setRequestLocale } from 'next-intl/server';
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
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Import dump v1</h1>
      <p style={{ color: '#666' }}>
        Deux modes : <strong>import complet</strong> (premier import, crée un
        nouveau workshop + insère toutes les entités) ou <strong>refresh
        partiel</strong> (hydrate uniquement les nouveaux champs ajoutés au
        schema export V1, sans toucher aux entités déjà en place).
      </p>
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <RefreshForm />
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        Import complet (nouveau workshop)
      </h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        ⚠️ Échoue si le workshop existe déjà (slug unique). À utiliser
        uniquement pour bootstrap d&apos;un atelier qui n&apos;est jamais entré dans V2.
      </p>
      <ImportForm />
    </div>
  );
}
