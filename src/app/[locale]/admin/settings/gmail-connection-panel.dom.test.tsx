import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { GmailConnectionPanel } from './gmail-connection-panel';

describe('GmailConnectionPanel', () => {
  it("non connecté → lien 'Connecter un compte Gmail'", () => {
    render(<GmailConnectionPanel connected={false} email={null} successMessage={null} errorMessage={null} />);
    const link = screen.getByRole('link', { name: /Connecter un compte Gmail/ });
    expect(link.getAttribute('href')).toBe('/api/auth/google/start');
  });

  it("non connecté → pas de bouton Déconnecter", () => {
    render(<GmailConnectionPanel connected={false} email={null} successMessage={null} errorMessage={null} />);
    expect(screen.queryByRole('button', { name: /Déconnecter Gmail/ })).toBeNull();
  });

  it("connecté → message '✓ Gmail connecté' avec email", () => {
    render(<GmailConnectionPanel connected={true} email="yako@gmail.com" successMessage={null} errorMessage={null} />);
    expect(screen.getByText(/✓ Gmail connecté/)).toBeTruthy();
    expect(screen.getByText('yako@gmail.com')).toBeTruthy();
  });

  it("connecté → bouton 'Déconnecter Gmail' visible", () => {
    render(<GmailConnectionPanel connected={true} email="yako@gmail.com" successMessage={null} errorMessage={null} />);
    expect(screen.getByRole('button', { name: /Déconnecter Gmail/ })).toBeTruthy();
  });

  it("connecté → lien Reconnecter visible", () => {
    render(<GmailConnectionPanel connected={true} email="yako@gmail.com" successMessage={null} errorMessage={null} />);
    const link = screen.getByRole('link', { name: /Reconnecter/ });
    expect(link.getAttribute('href')).toBe('/api/auth/google/start');
  });

  it("successMessage affiché avec ✓", () => {
    render(<GmailConnectionPanel connected={false} email={null} successMessage="Connexion réussie" errorMessage={null} />);
    expect(screen.getByText(/✓ Connexion réussie/)).toBeTruthy();
  });

  it("errorMessage affiché avec ✕", () => {
    render(<GmailConnectionPanel connected={false} email={null} successMessage={null} errorMessage="Token révoqué" />);
    expect(screen.getByText(/✕ Token révoqué/)).toBeTruthy();
  });
});
