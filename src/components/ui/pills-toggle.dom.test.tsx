import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PillsToggle, type PillsToggleOption } from './pills-toggle';

afterEach(() => {
  cleanup();
  document.body.classList.remove('light-mode');
});

const OPTIONS: PillsToggleOption<'CLIENT' | 'VELO'>[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'VELO', label: 'Vélo' },
];

describe('PillsToggle (indicator animé)', () => {
  it('rend un radiogroup avec aria-label', () => {
    render(
      <PillsToggle
        options={OPTIONS}
        value="CLIENT"
        onChange={() => {}}
        aria-label="Choix entité"
      />,
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Choix entité');
  });

  it('rend un button[role=radio] par option', () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it("aria-checked=true sur l'option sélectionnée", () => {
    render(<PillsToggle options={OPTIONS} value="VELO" onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]!.getAttribute('aria-checked')).toBe('false');
    expect(radios[1]!.getAttribute('aria-checked')).toBe('true');
  });

  it('click appelle onChange avec la value', () => {
    const onChange = vi.fn();
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('radio')[1]!);
    expect(onChange).toHaveBeenCalledWith('VELO');
  });

  it("bouton actif → font-semibold text-black", () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]!.className).toContain('font-semibold');
    expect(radios[0]!.className).toContain('text-black');
    expect(radios[1]!.className).not.toContain('font-semibold');
  });

  it("size 'md' (défaut) → height 60, font 13pt", () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const root = screen.getByRole('radiogroup');
    expect(root.style.height).toBe('60px');
    const radio = screen.getAllByRole('radio')[0]!;
    expect(radio.style.fontSize).toBe('13px');
  });

  it("size 'mini' → height 30, font 11pt", () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} size="mini" />);
    const root = screen.getByRole('radiogroup');
    expect(root.style.height).toBe('30px');
    const radio = screen.getAllByRole('radio')[0]!;
    expect(radio.style.fontSize).toBe('11px');
  });

  it("size 'sm' (intermédiaire) → height 38, font 12pt", () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} size="sm" />);
    expect(screen.getByRole('radiogroup').style.height).toBe('38px');
  });

  it('respecte ariaLabel par option', () => {
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

  it('value non-présente dans les options → aucune sélection', () => {
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

  it('themeToggle ajoute body.light-mode quand ariaLabel = "Light"', () => {
    const onChange = vi.fn();
    render(
      <PillsToggle
        options={[
          { value: 'L', label: '☀', ariaLabel: 'Light' },
          { value: 'D', label: '🌙', ariaLabel: 'Dark' },
        ]}
        value="D"
        onChange={onChange}
        themeToggle
      />,
    );
    fireEvent.click(screen.getByLabelText('Light'));
    expect(document.body.classList.contains('light-mode')).toBe(true);
    fireEvent.click(screen.getByLabelText('Dark'));
    expect(document.body.classList.contains('light-mode')).toBe(false);
  });

  it('grid 1fr columns (preview spec)', () => {
    render(<PillsToggle options={OPTIONS} value="CLIENT" onChange={() => {}} />);
    const root = screen.getByRole('radiogroup');
    expect(root.style.gridAutoColumns).toBe('1fr');
    expect(root.style.gridAutoFlow).toBe('column');
  });
});
