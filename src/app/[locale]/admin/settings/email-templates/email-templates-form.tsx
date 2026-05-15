'use client';

import { useActionState, useState } from 'react';
import {
  updateEmailTemplatesAction,
  type EmailTemplatesState,
} from '../email-templates-actions';
import {
  DEFAULT_EVAL_SUBJECT_FR,
  DEFAULT_EVAL_SUBJECT_EN,
  DEFAULT_EVAL_BODY_FR,
  DEFAULT_EVAL_BODY_EN,
  DEFAULT_FACTURE_SUBJECT_FR,
  DEFAULT_FACTURE_SUBJECT_EN,
  DEFAULT_FACTURE_BODY_FR,
  DEFAULT_FACTURE_BODY_EN,
  DEFAULT_VENTE_SUBJECT_FR,
  DEFAULT_VENTE_SUBJECT_EN,
  DEFAULT_VENTE_BODY_FR,
  DEFAULT_VENTE_BODY_EN,
  DEFAULT_SUIVI_SUBJECT_FR,
  DEFAULT_SUIVI_SUBJECT_EN,
  DEFAULT_SUIVI_BODY_FR,
  DEFAULT_SUIVI_BODY_EN,
  DEFAULT_SMS_RAPPEL_FR,
  DEFAULT_SMS_RAPPEL_EN,
  DEFAULT_SMS_SUIVI_FR,
  DEFAULT_SMS_SUIVI_EN,
  TEMPLATE_PLACEHOLDERS,
  type EmailTemplates,
} from '@/lib/email/render-template';

type Props = {
  initial: EmailTemplates;
  unmapped: Record<string, string>;
};

type LocaleTab = 'fr' | 'en';

export function EmailTemplatesForm({ initial, unmapped }: Props) {
  const [state, formAction, pending] = useActionState<EmailTemplatesState | null, FormData>(
    updateEmailTemplatesAction,
    null,
  );
  const [tab, setTab] = useState<LocaleTab>('fr');

  return (
    <form action={formAction} style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <TabBtn active={tab === 'fr'} onClick={() => setTab('fr')}>
          🇫🇷 Français
        </TabBtn>
        <TabBtn active={tab === 'en'} onClick={() => setTab('en')}>
          🇬🇧 English
        </TabBtn>
      </div>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Personnalise séparément FR et EN. Le client reçoit la version
        correspondant à <code>Client.lang</code>. Laisse vide pour utiliser
        le défaut V2. Placeholders : {' '}
        {TEMPLATE_PLACEHOLDERS.map((p) => (
          <code key={p} style={tagStyle}>{p}</code>
        ))}
      </p>

      <Block
        title="Évaluation BDT (courriel)"
        prefix="eval"
        tab={tab}
        initial={initial.eval}
        defaults={{
          subject_fr: DEFAULT_EVAL_SUBJECT_FR, subject_en: DEFAULT_EVAL_SUBJECT_EN,
          body_fr: DEFAULT_EVAL_BODY_FR, body_en: DEFAULT_EVAL_BODY_EN,
        }}
      />
      <Block
        title="Facture BDT (courriel)"
        prefix="facture"
        tab={tab}
        initial={initial.facture}
        defaults={{
          subject_fr: DEFAULT_FACTURE_SUBJECT_FR, subject_en: DEFAULT_FACTURE_SUBJECT_EN,
          body_fr: DEFAULT_FACTURE_BODY_FR, body_en: DEFAULT_FACTURE_BODY_EN,
        }}
      />
      <Block
        title="Vente directe (courriel)"
        prefix="vente"
        tab={tab}
        initial={initial.vente}
        defaults={{
          subject_fr: DEFAULT_VENTE_SUBJECT_FR, subject_en: DEFAULT_VENTE_SUBJECT_EN,
          body_fr: DEFAULT_VENTE_BODY_FR, body_en: DEFAULT_VENTE_BODY_EN,
        }}
      />
      <Block
        title="Courriel de suivi (post-livraison)"
        prefix="courrielSuivi"
        tab={tab}
        initial={initial.courrielSuivi}
        defaults={{
          subject_fr: DEFAULT_SUIVI_SUBJECT_FR, subject_en: DEFAULT_SUIVI_SUBJECT_EN,
          body_fr: DEFAULT_SUIVI_BODY_FR, body_en: DEFAULT_SUIVI_BODY_EN,
        }}
      />

      <h3 style={h3}>SMS rappel (vélo prêt)</h3>
      <p style={subtitleStyle}>Texte court, pas de HTML. Branché à Twilio en Sprint 3.</p>
      <Row label={`Corps SMS (${tab.toUpperCase()})`}>
        <textarea
          name={`smsRappel_body_${tab}`}
          defaultValue={initial.smsRappel?.body?.[tab] ?? ''}
          placeholder={tab === 'fr' ? DEFAULT_SMS_RAPPEL_FR : DEFAULT_SMS_RAPPEL_EN}
          rows={3}
          className="input-system font-mono text-sm"
        />
      </Row>

      <h3 style={h3}>SMS suivi</h3>
      <Row label={`Corps SMS (${tab.toUpperCase()})`}>
        <textarea
          name={`smsSuivi_body_${tab}`}
          defaultValue={initial.smsSuivi?.body?.[tab] ?? ''}
          placeholder={tab === 'fr' ? DEFAULT_SMS_SUIVI_FR : DEFAULT_SMS_SUIVI_EN}
          rows={3}
          className="input-system font-mono text-sm"
        />
      </Row>

      <h3 style={h3}>Outro global (toutes templates) — {tab.toUpperCase()}</h3>
      <p style={subtitleStyle}>
        Ajouté en bas de chaque courriel sauf si la template a son propre outro.
      </p>
      <Row label={`Outro (${tab.toUpperCase()})`}>
        <textarea
          name={`outro_${tab}`}
          defaultValue={initial.outro?.[tab] ?? ''}
          rows={2}
          className="input-system font-mono text-sm"
        />
      </Row>

      <h3 style={h3}>Signatures par lead</h3>
      <p style={subtitleStyle}>
        Workshop multi-marque (V1 yako-cyclo / cyclo-flex). Affichées au pied
        des courriels selon le lead du client.
      </p>
      <Row label="Signature yako-cyclo">
        <textarea
          name="signatures_yako"
          defaultValue={initial.signatures?.yako ?? ''}
          rows={2}
          className="input-system font-mono text-sm"
        />
      </Row>
      <Row label="Signature cyclo-flex">
        <textarea
          name="signatures_cf"
          defaultValue={initial.signatures?.cf ?? ''}
          rows={2}
          className="input-system font-mono text-sm"
        />
      </Row>

      {Object.keys(unmapped).length > 0 ? (
        <details style={{ marginTop: '1.5rem', background: '#fafafa', padding: '0.75rem 1rem', borderRadius: 6 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            🗂️ {Object.keys(unmapped).length} clés v1 non-mappées (lecture seule, pour audit)
          </summary>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Clés v1 que le mapper n&apos;a pas reconnues (Square legacy, paramètres
            atelier, suivi-done par BDT, etc.). Contenu préservé brut. Si une
            clé devrait être mappée, signale-la.
          </p>
          <ul style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '0 1rem', maxHeight: 240, overflow: 'auto' }}>
            {Object.entries(unmapped).map(([k, v]) => (
              <li key={k} style={{ marginBottom: '0.4rem' }}>
                <strong>{k}</strong> :{' '}
                <span style={{ color: '#666' }}>{v.length > 80 ? `${v.slice(0, 80)}…` : v}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {state?.error ? (
        <div className="mt-4 mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="mt-4 rounded-xl border border-green-400 bg-green-50 p-3 text-sm text-green-800">
          ✓ Templates enregistrés.
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary mt-4">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Block({
  title,
  prefix,
  tab,
  initial,
  defaults,
}: {
  title: string;
  prefix: 'eval' | 'facture' | 'vente' | 'courrielSuivi';
  tab: LocaleTab;
  initial: EmailTemplates['eval'];
  defaults: { subject_fr: string; subject_en: string; body_fr: string; body_en: string };
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={h3}>{title}</h3>
      {/* Rendre les 2 langues simultanément (input par locale) et cacher
          celle qui n'est pas active via display:none — comme ça les
          inputs persistent leurs valeurs entre changements d'onglet. */}
      {(['fr', 'en'] as const).map((loc) => (
        <div key={loc} style={{ display: tab === loc ? 'block' : 'none' }}>
          <Row label={`Sujet (${loc.toUpperCase()})`}>
            <input
              name={`${prefix}_subject_${loc}`}
              defaultValue={initial?.subject?.[loc] ?? ''}
              placeholder={loc === 'fr' ? defaults.subject_fr : defaults.subject_en}
              className="input-system"
            />
          </Row>
          <Row label={`Corps (${loc.toUpperCase()}, HTML accepté)`}>
            <textarea
              name={`${prefix}_body_${loc}`}
              defaultValue={initial?.body?.[loc] ?? ''}
              placeholder={loc === 'fr' ? defaults.body_fr : defaults.body_en}
              rows={8}
              className="input-system font-mono text-sm"
            />
          </Row>
          <details style={{ marginTop: '0.4rem' }}>
            <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
              Fragments granulaires (greeting / intro / cta / outro)
            </summary>
            <div style={{ paddingLeft: '0.5rem', marginTop: '0.5rem' }}>
              {(['greeting', 'intro', 'cta', 'outro'] as const).map((f) => (
                <Row key={f} label={`${f.charAt(0).toUpperCase() + f.slice(1)} (${loc.toUpperCase()})`}>
                  <textarea
                    name={`${prefix}_${f}_${loc}`}
                    defaultValue={(initial?.[f] as { [k in LocaleTab]?: string } | undefined)?.[loc] ?? ''}
                    rows={2}
                    className="input-system font-mono text-sm"
                  />
                </Row>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#444', marginBottom: '0.25rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.55rem 1rem',
        background: 'transparent',
        border: 0,
        borderBottom: active ? '2px solid #1565c0' : '2px solid transparent',
        color: active ? '#1565c0' : '#666',
        fontWeight: active ? 600 : 400,
        fontSize: '0.95rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const h3: React.CSSProperties = { fontSize: '1.05rem', marginTop: '1.5rem', marginBottom: '0.5rem' };
const subtitleStyle: React.CSSProperties = { color: '#888', fontSize: '0.8rem', marginTop: 0, marginBottom: '0.4rem' };
const tagStyle: React.CSSProperties = {
  background: '#f0f0f0',
  padding: '1px 5px',
  marginRight: 4,
  borderRadius: 3,
  fontSize: '0.85em',
};
