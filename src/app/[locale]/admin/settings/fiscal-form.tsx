'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateFiscalAction, type FiscalState } from './fiscal-actions';

export type FiscalEntity = {
  raisonSociale?: string;
  tagline?: string;
  adresseLigne1?: string;
  adresseLigne2?: string;
  ville?: string;
  codePostal?: string;
  province?: string;
  pays?: string;
  telephone?: string;
  courriel?: string;
  siteWeb?: string;
  neq?: string;
  tps?: string;
  tvq?: string;
  footerText?: string;
};

export function FiscalForm({ initial }: { initial: FiscalEntity }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FiscalState | null, FormData>(
    updateFiscalAction,
    null,
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction}>
      <h3 style={h3Style}>Identité légale</h3>
      <Field name="raisonSociale" label="Raison sociale (nom légal)" defaultValue={initial.raisonSociale} placeholder="Jean-Christophe Yacono (yako)" />
      <Field name="tagline" label="Tagline / sous-titre (affiché sous le nom sur les PDFs)" defaultValue={initial.tagline} placeholder="Ostéo de vélo et mécaniciens certifiés AEP" />
      <Field name="neq" label="NEQ (Numéro d&apos;entreprise du Québec)" defaultValue={initial.neq} placeholder="1234567890" />
      <div style={twoCol}>
        <Field name="tps" label="Numéro TPS" defaultValue={initial.tps} placeholder="123456789RT0001" />
        <Field name="tvq" label="Numéro TVQ" defaultValue={initial.tvq} placeholder="1234567890TQ0001" />
      </div>

      <h3 style={h3Style}>Adresse</h3>
      <Field name="adresseLigne1" label="Adresse ligne 1" defaultValue={initial.adresseLigne1} placeholder="4109, rue Saint-Denis" />
      <Field name="adresseLigne2" label="Adresse ligne 2 (optionnel)" defaultValue={initial.adresseLigne2} />
      <div style={threeCol}>
        <Field name="ville" label="Ville" defaultValue={initial.ville} placeholder="Montréal" />
        <Field name="province" label="Province" defaultValue={initial.province ?? 'Québec'} />
        <Field name="codePostal" label="Code postal" defaultValue={initial.codePostal} placeholder="H2W 2M7" />
      </div>
      <Field name="pays" label="Pays" defaultValue={initial.pays ?? 'Canada'} />

      <h3 style={h3Style}>Contact</h3>
      <div style={twoCol}>
        <Field name="telephone" label="Téléphone" defaultValue={initial.telephone} placeholder="514 995-3445" />
        <Field name="courriel" label="Courriel" defaultValue={initial.courriel} placeholder="contact@yako.cyclo" type="email" />
      </div>
      <Field name="siteWeb" label="Site web (optionnel)" defaultValue={initial.siteWeb} placeholder="https://yako.cyclo" />

      <h3 style={h3Style}>Footer PDF</h3>
      <div>
        <label style={labelStyle}>Texte affiché en bas des factures (optionnel)</label>
        <textarea
          name="footerText"
          defaultValue={initial.footerText ?? ''}
          rows={3}
          placeholder="Merci de votre visite ! Suivez-nous : @yako.cyclo"
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {state?.error ? (
        <div style={{ background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.75rem', borderRadius: 4, marginTop: '1rem' }}>
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', color: '#2e7d32', padding: '0.75rem', borderRadius: 4, marginTop: '1rem' }}>
          ✓ Identité fiscale enregistrée. Les prochaines factures émises l&apos;utiliseront.
        </div>
      ) : null}

      <button type="submit" disabled={pending} style={btnStyle(pending)}>
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string | null | undefined;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const h3Style: React.CSSProperties = {
  fontSize: '1rem',
  marginTop: '1.75rem',
  marginBottom: '0.75rem',
  color: '#333',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#444',
  marginBottom: '0.3rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
const twoCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
};
const threeCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gap: '1rem',
};
const btnStyle = (pending: boolean): React.CSSProperties => ({
  marginTop: '1rem',
  padding: '0.7rem 1.5rem',
  fontSize: '0.95rem',
  background: pending ? '#999' : '#1a1a1a',
  color: 'white',
  border: 0,
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
});
