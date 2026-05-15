import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

import { UiKitPillsToggle } from './pills-toggle-demo';

describe('UiKitPillsToggle', () => {
  it("rend les 5 options (Client, Vélo, Comptant, Interac, Cartes)", () => {
    render(<UiKitPillsToggle />);
    expect(screen.getByText('Client')).toBeTruthy();
    expect(screen.getByText('Vélo')).toBeTruthy();
    expect(screen.getByText('Comptant')).toBeTruthy();
    expect(screen.getByText('Interac')).toBeTruthy();
    expect(screen.getByText('Cartes')).toBeTruthy();
  });

  it("onglet 'client' actif par défaut → indicator visible", () => {
    render(<UiKitPillsToggle />);
    // L'affichage de l'état actuel est indiqué via le span → client
    expect(screen.getByText('→ client')).toBeTruthy();
  });

  it("clic 'Vélo' → état change à 'velo'", () => {
    render(<UiKitPillsToggle />);
    fireEvent.click(screen.getByText('Vélo'));
    expect(screen.getByText('→ velo')).toBeTruthy();
  });

  it("mode paiement 'interac' par défaut", () => {
    render(<UiKitPillsToggle />);
    expect(screen.getByText('→ interac')).toBeTruthy();
  });

  it("clic 'Cartes' → état change à 'cartes'", () => {
    render(<UiKitPillsToggle />);
    fireEvent.click(screen.getByText('Cartes'));
    expect(screen.getByText('→ cartes')).toBeTruthy();
  });
});
