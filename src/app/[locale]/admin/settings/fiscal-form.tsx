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
  googleReviewsUrl?: string;
  instagram?: string;
  facebook?: string;
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

      <h3 style={h3Style}>Réseaux sociaux & avis</h3>
      <Field
        name="googleReviewsUrl"
        label="Lien Google Reviews (utilisable dans les courriels et footer PDF)"
        defaultValue={initial.googleReviewsUrl}
        placeholder="https://g.page/r/.../review"
      />
      <div style={twoCol}>
        <Field name="instagram" label="Instagram (handle ou URL)" defaultValue={initial.instagram} placeholder="@yako.cyclo" />
        <Field name="facebook" label="Facebook (handle ou URL)" defaultValue={initial.facebook} placeholder="@yako.cyclo" />
      </div>

      <h3 style={h3Style}>Footer PDF</h3>
      <div>
        <label className="label-system">Texte affiché en bas des factures (optionnel)</label>
        <textarea
          name="footerText"
          defaultValue={initial.footerText ?? ''}
          rows={3}
          placeholder="Merci de votre visite ! Suivez-nous : @yako.cyclo"
          className="input-system"
        />
      </div>

      {state?.error ? (
        <div className="mt-4 mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="mt-4 rounded-xl border border-green-400 bg-green-50 p-3 text-sm text-green-800">
          ✓ Identité fiscale enregistrée. Les prochaines factures émises l&apos;utiliseront.
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary mt-4">
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
    <div className="mb-3">
      <label className="label-system">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="input-system"
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
