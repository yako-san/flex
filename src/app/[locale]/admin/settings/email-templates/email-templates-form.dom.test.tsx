import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../email-templates-actions', () => ({
  updateEmailTemplatesAction: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/email/render-template', () => ({
  DEFAULT_EVAL_SUBJECT_FR: 'Évaluation BDT (FR)',
  DEFAULT_EVAL_SUBJECT_EN: 'BDT Evaluation (EN)',
  DEFAULT_EVAL_BODY_FR: 'Corps éval FR',
  DEFAULT_EVAL_BODY_EN: 'Eval body EN',
  DEFAULT_FACTURE_SUBJECT_FR: 'Facture (FR)',
  DEFAULT_FACTURE_SUBJECT_EN: 'Invoice (EN)',
  DEFAULT_FACTURE_BODY_FR: 'Corps facture FR',
  DEFAULT_FACTURE_BODY_EN: 'Invoice body EN',
  DEFAULT_VENTE_SUBJECT_FR: 'Vente (FR)',
  DEFAULT_VENTE_SUBJECT_EN: 'Sale (EN)',
  DEFAULT_VENTE_BODY_FR: 'Corps vente FR',
  DEFAULT_VENTE_BODY_EN: 'Sale body EN',
  DEFAULT_SUIVI_SUBJECT_FR: 'Suivi (FR)',
  DEFAULT_SUIVI_SUBJECT_EN: 'Follow-up (EN)',
  DEFAULT_SUIVI_BODY_FR: 'Corps suivi FR',
  DEFAULT_SUIVI_BODY_EN: 'Follow-up body EN',
  DEFAULT_SMS_RAPPEL_FR: 'SMS rappel FR',
  DEFAULT_SMS_RAPPEL_EN: 'SMS reminder EN',
  DEFAULT_SMS_SUIVI_FR: 'SMS suivi FR',
  DEFAULT_SMS_SUIVI_EN: 'SMS follow-up EN',
  TEMPLATE_PLACEHOLDERS: ['{{clientPrenom}}', '{{clientNom}}', '{{workshopName}}'],
}));

import { EmailTemplatesForm } from './email-templates-form';

const INITIAL_EMPTY = {};

describe('EmailTemplatesForm', () => {
  it("onglets 🇫🇷 Français et 🇬🇧 English présents", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    expect(screen.getByText(/Français/)).toBeTruthy();
    expect(screen.getByText(/English/)).toBeTruthy();
  });

  it("onglet FR actif par défaut", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    // Au mount, on est sur l'onglet FR — le textarea smsRappel_body_fr existe
    const { container } = render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    expect(container.querySelector('textarea[name="smsRappel_body_fr"]')).toBeTruthy();
  });

  it("clic sur English → textarea smsRappel_body_en apparaît", () => {
    const { container } = render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    fireEvent.click(screen.getAllByText(/English/)[0]!);
    expect(container.querySelector('textarea[name="smsRappel_body_en"]')).toBeTruthy();
  });

  it("bouton 'Enregistrer' type=submit", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    const btn = screen.getByRole('button', { name: /Enregistrer/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("placeholders mentionnés dans l'UI", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    expect(screen.getByText('{{clientPrenom}}')).toBeTruthy();
  });

  it("sections Évaluation, Facture, Vente, SMS rappel présentes", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    expect(screen.getByText('Évaluation BDT (courriel)')).toBeTruthy();
    expect(screen.getByText('Facture BDT (courriel)')).toBeTruthy();
    expect(screen.getByText('Vente directe (courriel)')).toBeTruthy();
    expect(screen.getByText(/SMS rappel/)).toBeTruthy();
  });

  it("au mount, pas de message erreur ni succès", () => {
    render(<EmailTemplatesForm initial={INITIAL_EMPTY} unmapped={{}} />);
    expect(screen.queryByText(/✓ Templates/)).toBeNull();
  });
});
