// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ConfirmDialogHost, customConfirm } from './confirm-dialog';

// Réinitialiser le DOM entre chaque test (le ConfirmDialogHost utilise un
// singleton publish/subscribe, donc un dialog laissé ouvert pollue le test
// suivant).
beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('customConfirm singleton', () => {
  it('résout false quand on clique sur Annuler', async () => {
    render(<ConfirmDialogHost />);

    const promise = customConfirm({ title: 'Sure to nuke?' });

    // Le bouton "Annuler" doit apparaître après publish() async via setState
    const cancelBtn = await screen.findByRole('button', { name: /annuler/i });
    act(() => {
      cancelBtn.click();
    });

    await expect(promise).resolves.toBe(false);
  });

  it("résout true quand on clique sur le bouton Confirmer", async () => {
    render(<ConfirmDialogHost />);

    const promise = customConfirm({ title: 'Save and continue?', confirmLabel: 'Continuer' });

    const confirmBtn = await screen.findByRole('button', { name: /^continuer$/i });
    act(() => {
      confirmBtn.click();
    });

    await expect(promise).resolves.toBe(true);
  });

  it('affiche le message et les labels custom', async () => {
    render(<ConfirmDialogHost />);

    const promise = customConfirm({
      title: 'Verifier?',
      message: 'Action irréversible.',
      confirmLabel: 'Oui, fais-le',
      cancelLabel: 'Non, attends',
    });

    expect(await screen.findByText('Action irréversible.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /oui, fais-le/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /non, attends/i })).toBeTruthy();

    // Ferme la modal pour que le DOM soit clean
    act(() => {
      screen.getByRole('button', { name: /non, attends/i }).click();
    });
    await promise;
  });

  it('variant danger : le bouton confirm a la variante danger (Button rouge)', async () => {
    render(<ConfirmDialogHost />);

    const promise = customConfirm({
      title: 'Effacer base?',
      variant: 'danger',
      confirmLabel: 'Effacer',
    });

    const btn = await screen.findByRole('button', { name: /^effacer$/i });
    // Le Button variant danger utilise --rouge ; on vérifie qu'il a la classe
    // attendue contenant "rouge" ou un fond rouge.
    expect(btn.className).toMatch(/rouge|danger/i);

    act(() => {
      btn.click();
    });
    await expect(promise).resolves.toBe(true);
  });

  it('plusieurs customConfirm successifs : le 2ème démarre après réponse du 1er', async () => {
    render(<ConfirmDialogHost />);

    const p1 = customConfirm({ title: 'First action' });
    const cancel1 = await screen.findByRole('button', { name: /annuler/i });
    act(() => {
      cancel1.click();
    });
    await expect(p1).resolves.toBe(false);

    const p2 = customConfirm({ title: 'Second action', confirmLabel: 'OK' });
    const ok2 = await screen.findByRole('button', { name: /^ok$/i });
    act(() => {
      ok2.click();
    });
    await expect(p2).resolves.toBe(true);
  });
});
