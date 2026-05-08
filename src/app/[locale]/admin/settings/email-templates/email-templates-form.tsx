'use client';

import { useActionState } from 'react';
import {
  updateEmailTemplatesAction,
  type EmailTemplatesState,
} from '../email-templates-actions';
import {
  DEFAULT_EVAL_SUBJECT,
  DEFAULT_EVAL_BODY,
  DEFAULT_FACTURE_SUBJECT,
  DEFAULT_FACTURE_BODY,
  DEFAULT_VENTE_SUBJECT,
  DEFAULT_VENTE_BODY,
  DEFAULT_SMS_RAPPEL,
  DEFAULT_SMS_SUIVI,
  TEMPLATE_PLACEHOLDERS,
} from '@/lib/email/render-template';

type Props = {
  initial: {
    evalSubject?: string;
    evalBody?: string;
    factureSubject?: string;
    factureBody?: string;
    venteSubject?: string;
    venteBody?: string;
    smsRappelBody?: string;
    smsSuiviBody?: string;
  };
};

export function EmailTemplatesForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState<EmailTemplatesState | null, FormData>(
    updateEmailTemplatesAction,
    null,
  );

  return (
    <form action={formAction} style={{ maxWidth: 760 }}>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Laisse vide pour utiliser le texte par défaut. Placeholders disponibles :{' '}
        {TEMPLATE_PLACEHOLDERS.map((p) => (
          <code
            key={p}
            style={{
              background: '#f0f0f0',
              padding: '1px 5px',
              marginRight: 4,
              borderRadius: 3,
              fontSize: '0.85em',
            }}
          >
            {p}
          </code>
        ))}
      </p>

      <h3 style={h3}>Évaluation BDT (courriel)</h3>
      <Row label="Sujet">
        <input
          name="evalSubject"
          defaultValue={initial.evalSubject ?? ''}
          placeholder={DEFAULT_EVAL_SUBJECT}
          style={inputStyle}
        />
      </Row>
      <Row label="Corps (HTML accepté)">
        <textarea
          name="evalBody"
          defaultValue={initial.evalBody ?? ''}
          placeholder={DEFAULT_EVAL_BODY}
          rows={10}
          style={textareaStyle}
        />
      </Row>

      <h3 style={h3}>Facture BDT (courriel)</h3>
      <Row label="Sujet">
        <input
          name="factureSubject"
          defaultValue={initial.factureSubject ?? ''}
          placeholder={DEFAULT_FACTURE_SUBJECT}
          style={inputStyle}
        />
      </Row>
      <Row label="Corps (HTML accepté)">
        <textarea
          name="factureBody"
          defaultValue={initial.factureBody ?? ''}
          placeholder={DEFAULT_FACTURE_BODY}
          rows={10}
          style={textareaStyle}
        />
      </Row>

      <h3 style={h3}>Vente directe (courriel)</h3>
      <Row label="Sujet">
        <input
          name="venteSubject"
          defaultValue={initial.venteSubject ?? ''}
          placeholder={DEFAULT_VENTE_SUBJECT}
          style={inputStyle}
        />
      </Row>
      <Row label="Corps (HTML accepté)">
        <textarea
          name="venteBody"
          defaultValue={initial.venteBody ?? ''}
          placeholder={DEFAULT_VENTE_BODY}
          rows={8}
          style={textareaStyle}
        />
      </Row>

      <h3 style={h3}>SMS rappel (vélo prêt à récupérer)</h3>
      <p style={{ color: '#888', fontSize: '0.8rem', marginTop: 0 }}>
        Texte court, pas de HTML. Provider SMS pas encore branché — sera utilisé
        dès intégration Twilio.
      </p>
      <Row label="Corps SMS">
        <textarea
          name="smsRappelBody"
          defaultValue={initial.smsRappelBody ?? ''}
          placeholder={DEFAULT_SMS_RAPPEL}
          rows={3}
          style={textareaStyle}
        />
      </Row>

      <h3 style={h3}>SMS suivi (après livraison)</h3>
      <Row label="Corps SMS">
        <textarea
          name="smsSuiviBody"
          defaultValue={initial.smsSuiviBody ?? ''}
          placeholder={DEFAULT_SMS_SUIVI}
          rows={3}
          style={textareaStyle}
        />
      </Row>

      {state?.error ? (
        <div style={{ background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.75rem', borderRadius: 4, marginBottom: '1rem' }}>
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div style={{ background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20', padding: '0.75rem', borderRadius: 4, marginBottom: '1rem' }}>
          ✓ Templates enregistrés.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.7rem 1.5rem',
          fontSize: '0.95rem',
          background: pending ? '#999' : '#1a1a1a',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#444', marginBottom: '0.3rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const h3: React.CSSProperties = { fontSize: '1.05rem', marginTop: '1.5rem', marginBottom: '0.75rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem' };
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  resize: 'vertical',
};
