import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./email-actions', () => ({
  sendEvalEmailAction: vi.fn().mockResolvedValue({ success: true, mode: 'draft' }),
  sendFactureEmailAction: vi.fn().mockResolvedValue({ success: true, mode: 'draft' }),
  sendSuiviEmailAction: vi.fn().mockResolvedValue({ success: true, mode: 'draft' }),
}));

import { EmailButtons } from './email-buttons';

const BASE = {
  bdcId: 'b1',
  clientCourriel: 'client@test.ca',
  evalEnvoyee: false,
  suiviEnvoye: false,
  factureLogId: null,
  factureNumero: null,
  gmailConnected: false,
  gmailEmail: null,
};

describe('EmailButtons', () => {
  it("clientCourriel null → message d'erreur, pas de boutons", () => {
    render(<EmailButtons {...BASE} clientCourriel={null} />);
    expect(screen.getByText(/Pas de courriel client/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it("factureLogId null → seulement 2 boutons (éval + suivi)", () => {
    render(<EmailButtons {...BASE} />);
    expect(screen.getByText(/Envoyer l'éval par courriel/)).toBeTruthy();
    expect(screen.getByText(/Envoyer le courriel de suivi/)).toBeTruthy();
    expect(screen.queryByText(/Envoyer la facture par courriel/)).toBeNull();
  });

  it("factureLogId défini → 3 boutons (éval + facture + suivi)", () => {
    render(<EmailButtons {...BASE} factureLogId="fl1" factureNumero="F-001" />);
    expect(screen.getByText(/Envoyer l'éval par courriel/)).toBeTruthy();
    expect(screen.getByText(/Envoyer la facture par courriel/)).toBeTruthy();
    expect(screen.getByText(/Envoyer le courriel de suivi/)).toBeTruthy();
  });

  it("evalEnvoyee=true → label 'Renvoyer l'éval'", () => {
    render(<EmailButtons {...BASE} evalEnvoyee={true} />);
    expect(screen.getByText(/Renvoyer l'éval par courriel/)).toBeTruthy();
  });

  it("suiviEnvoye=true → label 'Renvoyer le courriel de suivi'", () => {
    render(<EmailButtons {...BASE} suiviEnvoye={true} />);
    expect(screen.getByText(/Renvoyer le courriel de suivi/)).toBeTruthy();
  });

  it("au mount, pas de form de saisie visible", () => {
    render(<EmailButtons {...BASE} />);
    expect(screen.queryByPlaceholderText(/Message personnalisé/)).toBeNull();
  });

  it("clic sur bouton éval → ouvre form de saisie", () => {
    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByPlaceholderText(/Message personnalisé/)).toBeTruthy();
  });

  it("form ouvert affiche destinataire", () => {
    render(<EmailButtons {...BASE} clientCourriel="marie@ex.ca" />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByText('marie@ex.ca')).toBeTruthy();
  });

  it("gmailConnected=false → pas de toggle draft/send (mais bouton 'Envoyer maintenant' présent)", () => {
    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    // Pas de pill Brouillon Gmail
    expect(screen.queryByText('Brouillon Gmail')).toBeNull();
    // Le bouton submit s'appelle 'Envoyer maintenant' mais pas en tant que pill
    // (donc apparait quand même comme texte) → on vérifie l'absence du toggle de mode
    const submitBtns = screen.getAllByText('Envoyer maintenant');
    expect(submitBtns).toHaveLength(1); // un seul = le bouton submit, pas de pill
  });

  it("gmailConnected=true → toggle Brouillon/Envoyer visible", () => {
    render(
      <EmailButtons
        {...BASE}
        gmailConnected={true}
        gmailEmail="atelier@yako-cyclo.ca"
      />,
    );
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByText('Brouillon Gmail')).toBeTruthy();
    expect(screen.getByText('Envoyer maintenant')).toBeTruthy();
  });

  it("gmailConnected=true → bouton par défaut 'Créer le brouillon Gmail'", () => {
    render(
      <EmailButtons {...BASE} gmailConnected={true} gmailEmail="x@y.ca" />,
    );
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByText('Créer le brouillon Gmail')).toBeTruthy();
  });

  it("gmailConnected=false → bouton par défaut 'Envoyer maintenant'", () => {
    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByText('Envoyer maintenant')).toBeTruthy();
  });

  it("clic sur 2e fois sur même bouton → ferme le form (toggle)", () => {
    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.getByPlaceholderText(/Message personnalisé/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    expect(screen.queryByPlaceholderText(/Message personnalisé/)).toBeNull();
  });

  it("saisir un message → textarea reflète", () => {
    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    const textarea = screen.getByPlaceholderText(/Message personnalisé/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Salut Marie!' } });
    expect(textarea.value).toBe('Salut Marie!');
  });

  it("clic 'Envoyer maintenant' → sendEvalEmailAction(bdcId, msg, mode)", async () => {
    const { sendEvalEmailAction } = await import('./email-actions');
    vi.mocked(sendEvalEmailAction).mockClear();
    vi.mocked(sendEvalEmailAction).mockResolvedValue({ success: true, mode: 'send' });

    render(<EmailButtons {...BASE} bdcId="b42" />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    fireEvent.click(screen.getByText('Envoyer maintenant'));

    await vi.waitFor(() => {
      expect(vi.mocked(sendEvalEmailAction)).toHaveBeenCalledWith('b42', null, 'send');
    });
  });

  it("succès → message de confirmation visible", async () => {
    const { sendEvalEmailAction } = await import('./email-actions');
    vi.mocked(sendEvalEmailAction).mockResolvedValue({ success: true, mode: 'send' });

    render(<EmailButtons {...BASE} />);
    fireEvent.click(screen.getByText(/Envoyer l'éval par courriel/));
    fireEvent.click(screen.getByText('Envoyer maintenant'));

    await vi.waitFor(() => {
      expect(screen.getByText('Courriel envoyé.')).toBeTruthy();
    });
  });
});
