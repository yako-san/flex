import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ArchiveChoiceDialog } from './archive-choice-dialog';

afterEach(() => cleanup());

describe('ArchiveChoiceDialog', () => {
  it("fermé (open=false) → DialogTitle non rendu dans le DOM (Radix)", () => {
    render(
      <ArchiveChoiceDialog open={false} onOpenChange={() => {}} onChoose={() => {}} />,
    );
    expect(screen.queryByText('Archiver le BDT')).toBeNull();
  });

  it('ouvert (open=true) → 4 boutons paiement + REFUSE', () => {
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={() => {}} />);
    expect(screen.getByText('Archiver le BDT')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Comptant/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Interac/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cartes/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Refusé/i })).toBeTruthy();
  });

  it("clic Comptant → onChoose('COMPTANT')", () => {
    const onChoose = vi.fn();
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Comptant/i }));
    expect(onChoose).toHaveBeenCalledWith('COMPTANT');
  });

  it("clic Interac → onChoose('INTERAC')", () => {
    const onChoose = vi.fn();
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Interac/i }));
    expect(onChoose).toHaveBeenCalledWith('INTERAC');
  });

  it("clic Cartes → onChoose('CARTES')", () => {
    const onChoose = vi.fn();
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cartes/i }));
    expect(onChoose).toHaveBeenCalledWith('CARTES');
  });

  it("clic Refusé → onChoose('REFUSE')", () => {
    const onChoose = vi.fn();
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Refusé/i }));
    expect(onChoose).toHaveBeenCalledWith('REFUSE');
  });

  it("Reste à encaisser affiché si resteAPayer > 0 (format fr-CA)", () => {
    render(
      <ArchiveChoiceDialog
        open
        onOpenChange={() => {}}
        onChoose={() => {}}
        resteAPayer={75.5}
      />,
    );
    expect(screen.getByText('Reste à encaisser')).toBeTruthy();
    expect(screen.getByText('75,50 $')).toBeTruthy();
  });

  it("resteAPayer = 0 → pas de bloc 'Reste à encaisser'", () => {
    render(
      <ArchiveChoiceDialog
        open
        onOpenChange={() => {}}
        onChoose={() => {}}
        resteAPayer={0}
      />,
    );
    expect(screen.queryByText('Reste à encaisser')).toBeNull();
  });

  it('resteAPayer null/absent → pas de bloc', () => {
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={() => {}} />);
    expect(screen.queryByText('Reste à encaisser')).toBeNull();
  });

  it("bouton 'Annuler' (DialogClose) ferme via onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <ArchiveChoiceDialog open onOpenChange={onOpenChange} onChoose={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pendant async, bouton busy affiche '…'", async () => {
    let resolve!: () => void;
    const onChoose = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Comptant/i }));
    // Le bouton clicked devient '…' pendant le pending
    // (le label est remplacé)
    expect(screen.getByText('…')).toBeTruthy();
    resolve!();
  });

  it('pendant Refusé async → label "En cours…"', async () => {
    let resolve!: () => void;
    const onChoose = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );
    render(<ArchiveChoiceDialog open onOpenChange={() => {}} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Refusé/i }));
    expect(screen.getByText('En cours…')).toBeTruthy();
    resolve!();
  });
});
