import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BdtSidecard, type BdtSidecardProps } from './bdt-sidecard';

afterEach(() => cleanup());

const BASE: BdtSidecardProps = {
  locale: 'fr-CA',
  bdcNumero: 42,
  veloNumero: 7,
  veloStatus: 'RV',
  velo: {
    marque: 'Trek',
    modele: '7300',
    couleur: 'rouge',
    taille: 'M',
    numeroSerie: 'SN123',
  },
  client: { id: 'c1', prenom: 'Marie', nom: 'Tremblay' },
  dateIn: new Date('2026-05-14T10:30:00Z'),
  dateOut: null,
  evalMecano: { id: 'm1', nom: 'Yako' },
  mecaMecano: null,
  ctrlMecano: null,
  workflow: {
    cbEvalEnvoye: false,
    cbEval: false,
    cbBonSortie: false,
    cbArchiver: false,
  },
  noteInterne: null,
};

describe('BdtSidecard', () => {
  it("affiche bdcNumero paddé 4 chiffres", () => {
    render(<BdtSidecard {...BASE} bdcNumero={1} />);
    expect(screen.getByText('0001')).toBeTruthy();
  });

  it("affiche le label de statut vélo en français", () => {
    render(<BdtSidecard {...BASE} veloStatus="APPROUVE" />);
    expect(screen.getByText('APPROUVÉ')).toBeTruthy();
  });

  it("statut RV → fond jaune signature V1 (#fff056)", () => {
    const { container } = render(<BdtSidecard {...BASE} veloStatus="RV" />);
    const cards = container.querySelectorAll('[style*="background"]');
    expect(cards.length).toBeGreaterThan(0);
    const bgColor = (cards[0] as HTMLElement).style.backgroundColor;
    // happy-dom préserve la chaîne hex source
    expect(bgColor.toLowerCase()).toBe('#fff056');
  });

  it("section 'client' par défaut → lien client visible", () => {
    render(<BdtSidecard {...BASE} />);
    const link = screen.getByText('Marie Tremblay');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/fr-CA/admin/clients/c1');
  });

  it("section 'velo' → numéro série + détails vélo", () => {
    render(<BdtSidecard {...BASE} section="velo" />);
    expect(screen.getByText(/S\/N SN123/)).toBeTruthy();
    expect(screen.getByText('Trek, 7300')).toBeTruthy();
  });

  it("client null → fallback sur section vélo", () => {
    render(<BdtSidecard {...BASE} client={null} />);
    // Même en section='client' (default), si client=null on tombe sur l'affichage vélo
    expect(screen.getByText(/vélo 0007/)).toBeTruthy();
  });

  it("velo sans marque/modele → 'Sélection → …'", () => {
    render(
      <BdtSidecard
        {...BASE}
        client={null}
        velo={{ marque: null, modele: null, couleur: null, taille: null, numeroSerie: null }}
      />,
    );
    expect(screen.getByText(/Sélection/)).toBeTruthy();
  });

  it("date in/out formatées en YYYY-MM-DD\\nHH:MM, '—' si null", () => {
    render(<BdtSidecard {...BASE} />);
    expect(screen.getByText('Date out').nextElementSibling?.textContent).toContain('—');
  });

  it("3 lignes Séquence de travail (eval / mécanique / ctrl. qlté)", () => {
    render(<BdtSidecard {...BASE} />);
    expect(screen.getByText('évaluation')).toBeTruthy();
    expect(screen.getByText('mécanique')).toBeTruthy();
    expect(screen.getByText('ctrl. qlté')).toBeTruthy();
  });

  it("mécano assigné rendu avec son nom", () => {
    render(<BdtSidecard {...BASE} />);
    expect(screen.getByText(/Yako/)).toBeTruthy();
  });

  it("Avancement : 4 WorkflowItem statiques si pas de slot", () => {
    render(<BdtSidecard {...BASE} />);
    expect(screen.getByText('Évaluation envoyée')).toBeTruthy();
    expect(screen.getByText('Éval. validée')).toBeTruthy();
    expect(screen.getByText('Bon de sortie')).toBeTruthy();
    expect(screen.getByText('Archiver')).toBeTruthy();
  });

  it("advancementSlot remplace les WorkflowItem statiques", () => {
    render(
      <BdtSidecard
        {...BASE}
        advancementSlot={<div data-testid="custom-advance">Custom</div>}
      />,
    );
    expect(screen.getByTestId('custom-advance')).toBeTruthy();
    // Les 4 par défaut ne doivent plus apparaître
    expect(screen.queryByText('Évaluation envoyée')).toBeNull();
  });

  it("sectionToggleUrl → 2 liens client/velo", () => {
    render(
      <BdtSidecard
        {...BASE}
        sectionToggleUrl={{
          client: '/fr-CA/admin/inventaire/x?s=client',
          velo: '/fr-CA/admin/inventaire/x?s=velo',
        }}
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.includes('s=client'))).toBe(true);
    expect(links.some((l) => l.getAttribute('href')?.includes('s=velo'))).toBe(true);
  });

  it("pas de sectionToggleUrl → pas de toggles", () => {
    render(<BdtSidecard {...BASE} />);
    // Aucun href ?s=client ou ?s=velo
    const links = screen.queryAllByRole('link');
    expect(links.every((l) => !l.getAttribute('href')?.includes('?s='))).toBe(true);
  });

  it("noteInterne affichée si présent", () => {
    render(<BdtSidecard {...BASE} noteInterne="Vélo prêt mardi" />);
    expect(screen.getByText('Vélo prêt mardi')).toBeTruthy();
  });

  it("footerSlot rendu en bas", () => {
    render(
      <BdtSidecard
        {...BASE}
        footerSlot={<div data-testid="footer">Form complet</div>}
      />,
    );
    expect(screen.getByTestId('footer')).toBeTruthy();
  });
});
