import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  updatePieceItemCmdAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { PieceCmdEditor } from './piece-cmd-editor';

describe('PieceCmdEditor (popover trigger surface)', () => {
  it("cmdStatus=null → trigger sigle '·' (non défini)", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus={null} cmdNote={null} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('·');
    expect(btn.getAttribute('title')).toBe('— non défini');
  });

  it("cmdStatus=LISTEE → trigger sigle '...'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="LISTEE" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('...');
  });

  it("cmdStatus=ESTIMEE → trigger sigle '—'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="ESTIMEE" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('—');
  });

  it("cmdStatus=A_COMMANDER → trigger sigle '√'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="A_COMMANDER" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('√');
  });

  it("cmdStatus=EN_COMMANDE → trigger sigle '$'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="EN_COMMANDE" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('$');
  });

  it("cmdStatus=RECU_PARTIEL → trigger sigle '#'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="RECU_PARTIEL" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('#');
  });

  it("cmdStatus=RECUE → trigger sigle '@'", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="RECUE" cmdNote={null} />);
    expect(screen.getByRole('button').textContent).toBe('@');
  });

  it("popover fermé par défaut → 7 boutons options pas visibles", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus={null} cmdNote={null} />);
    // Seul le trigger est visible (1 button)
    expect(screen.getAllByRole('button').length).toBe(1);
  });

  it("title sur trigger reflète le label complet", () => {
    render(<PieceCmdEditor itemId="i1" cmdStatus="RECUE" cmdNote={null} />);
    expect(screen.getByRole('button').getAttribute('title')).toBe('Reçue');
  });
});
