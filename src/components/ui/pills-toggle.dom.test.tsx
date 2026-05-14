import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PillsToggle, type PillsToggleOption } from './pills-toggle';

afterEach(() => cleanup());

const OPTIONS: PillsToggleOption<'CLIENT' | 'VELO'>[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'VELO', label: 'Vélo' },
];

describe('PillsToggle', () => {
  it('rend un radiogroup avec aria-label', () => {
    render(
      <PillsToggle
        options={OPTIONS}
        value="CLIENT"
        onChange={() => {}}
        aria-label="Choix entité"
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Choix entité');
  });

  it('rend un button[role=radio] par option', () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(2);
  });

  it("aria-checked=true sur l'option sélectionnée", () => {
    render(<PillsToggle options={OPTIONS} value="VELO" onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]!.getAttribute('aria-checked')).toBe('false');
    expect(radios[1]!.getAttribute('aria-checked')).toBe('true');
  });

  it('click appelle onChange avec la value de l\'option', () => {
    const onChange = vi.fn();
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('radio')[1]!);
    expect(onChange).toHaveBeenCalledWith('VELO');
  });

  it('class active = bg-[var(--jaune)] sur l\'option sélectionnée', () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]!.className).toContain('bg-[var(--jaune)]');
    expect(radios[1]!.className).not.toContain('bg-[var(--jaune)]');
  });

  it("size 'sm' → text-xs + px-3", () => {
    render(
      <PillsToggle
        options={OPTIONS}
        value="CLIENT"
        onChange={() => {}}
        size="sm"
      />,
    );
    const radio = screen.getAllByRole('radio')[0]!;
    expect(radio.className).toContain('text-xs');
    expect(radio.className).toContain('px-3');
  });

  it("size 'md' (défaut) → text-sm + px-4", () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const radio = screen.getAllByRole('radio')[0]!;
    expect(radio.className).toContain('text-sm');
    expect(radio.className).toContain('px-4');
  });

  it('respecte ariaLabel par option (button-level)', () => {
    render(
      <PillsToggle
        options={[
          { value: 'A', label: '🌞', ariaLabel: 'Soleil' },
          { value: 'B', label: '🌙', ariaLabel: 'Lune' },
        ]}
        value="A"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Soleil')).toBeTruthy();
    expect(screen.getByLabelText('Lune')).toBeTruthy();
  });

  it('liste vide → radiogroup vide', () => {
    render(<PillsToggle options={[]} value={'X' as never} onChange={() => {}} />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('value non-présente dans les options → aucune sélection (aria-checked tous false)', () => {
    render(
      <PillsToggle
        options={OPTIONS}
        value={'AUTRE' as never}
        onChange={() => {}}
      />,
    );
    for (const r of screen.getAllByRole('radio')) {
      expect(r.getAttribute('aria-checked')).toBe('false');
    }
  });
});
