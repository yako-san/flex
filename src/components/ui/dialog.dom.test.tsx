import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

afterEach(() => cleanup());

describe('Dialog (Radix wrapper)', () => {
  it("rend trigger sans content si fermé", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Modal title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.queryByText('Modal title')).toBeNull();
  });

  it("open=true → content rendu dans le DOM (portal)", () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Modal title</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Modal title')).toBeTruthy();
    expect(screen.getByText('Description text')).toBeTruthy();
  });

  it("clic trigger ouvre le dialog (uncontrolled)", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Now open</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText('Now open')).toBeNull();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Now open')).toBeTruthy();
  });

  it("DialogContent par défaut affiche bouton 'Fermer' (X)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>t</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByLabelText('Fermer')).toBeTruthy();
  });

  it("showClose=false → pas de bouton fermer", () => {
    render(
      <Dialog open>
        <DialogContent showClose={false}>
          <DialogTitle>t</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByLabelText('Fermer')).toBeNull();
  });

  it("onOpenChange appelé quand bouton Fermer cliqué", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>t</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("DialogHeader rend un <div> avec gap classes", () => {
    render(<DialogHeader data-testid="h">x</DialogHeader>);
    const h = screen.getByTestId('h');
    expect(h.tagName).toBe('DIV');
    expect(h.className).toContain('gap-1.5');
  });

  it("DialogFooter rend un <div> stack-reverse mobile + row desktop", () => {
    render(<DialogFooter data-testid="f">x</DialogFooter>);
    const f = screen.getByTestId('f');
    expect(f.className).toContain('flex-col-reverse');
    expect(f.className).toContain('sm:flex-row');
    expect(f.className).toContain('sm:justify-end');
  });

  it("DialogTitle a font-bold + text-lg V1", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Mon titre</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const title = screen.getByText('Mon titre');
    expect(title.className).toContain('text-lg');
    expect(title.className).toContain('font-bold');
  });

  it("DialogDescription a text-sm + couleur secondary", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>t</DialogTitle>
          <DialogDescription>desc</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const desc = screen.getByText('desc');
    expect(desc.className).toContain('text-sm');
    expect(desc.className).toContain('text-[var(--text-secondary-60)]');
  });

  it("Escape ferme le dialog (uncontrolled)", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Open</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Open')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    // Radix ferme via Escape par défaut
    expect(screen.queryByText('Open')).toBeNull();
  });
});
