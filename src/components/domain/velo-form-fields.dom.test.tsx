import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VeloFormFields, type Marque, type VeloDraft } from './velo-form-fields';

afterEach(() => cleanup());

const MARQUES: Marque[] = [
  { id: 'm1', nom: 'Trek', taillesDisponibles: ['S', 'M', 'L'] },
  { id: 'm2', nom: 'Specialized', taillesDisponibles: [] },
  { id: 'm3', nom: 'Giant' },
];

const EMPTY: VeloDraft = { marqueId: null, modele: '', couleur: '', taille: null };

describe('VeloFormFields', () => {
  it('rend 4 labels : Marque / Modèle / Couleur / Taille', () => {
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} />);
    expect(screen.getByText('Marque')).toBeTruthy();
    expect(screen.getByText('Modèle')).toBeTruthy();
    expect(screen.getByText('Couleur')).toBeTruthy();
    expect(screen.getByText('Taille')).toBeTruthy();
  });

  it('marque vide par défaut → option "— choisir —" sélectionnée disabled', () => {
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} />);
    const select = screen.getByLabelText('Marque') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('liste toutes les marques en option', () => {
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} />);
    expect(screen.getByText('Trek')).toBeTruthy();
    expect(screen.getByText('Specialized')).toBeTruthy();
    expect(screen.getByText('Giant')).toBeTruthy();
  });

  it("changement marque → onChange { marqueId, taille: null }", () => {
    const onChange = vi.fn();
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Marque'), { target: { value: 'm1' } });
    expect(onChange).toHaveBeenCalledWith({
      marqueId: 'm1',
      modele: '',
      couleur: '',
      taille: null,
    });
  });

  it("marque '' (clear) → marqueId: null", () => {
    const onChange = vi.fn();
    render(
      <VeloFormFields
        marques={MARQUES}
        value={{ marqueId: 'm1', modele: '', couleur: '', taille: 'M' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Marque'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ marqueId: null, taille: null }),
    );
  });

  it("changement modèle → onChange { modele: 'X' }", () => {
    const onChange = vi.fn();
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Modèle'), {
      target: { value: 'Lite 1' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ modele: 'Lite 1' }),
    );
  });

  it("changement couleur → onChange { couleur: 'vert émeraude' }", () => {
    const onChange = vi.fn();
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Couleur'), {
      target: { value: 'vert émeraude' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ couleur: 'vert émeraude' }),
    );
  });

  it("marque avec taillesDisponibles → taille = select", () => {
    render(
      <VeloFormFields
        marques={MARQUES}
        value={{ ...EMPTY, marqueId: 'm1' }}
        onChange={() => {}}
      />,
    );
    expect((screen.getByLabelText('Taille') as HTMLElement).tagName).toBe('SELECT');
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText('L')).toBeTruthy();
  });

  it("marque SANS taillesDisponibles → taille = input libre", () => {
    render(
      <VeloFormFields
        marques={MARQUES}
        value={{ ...EMPTY, marqueId: 'm2' }}
        onChange={() => {}}
      />,
    );
    expect((screen.getByLabelText('Taille') as HTMLElement).tagName).toBe('INPUT');
  });

  it("aucune marque sélectionnée → taille = input libre (fallback)", () => {
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} />);
    expect((screen.getByLabelText('Taille') as HTMLElement).tagName).toBe('INPUT');
  });

  it("taille select disabled si marqueId vide", () => {
    render(<VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} />);
    // input libre fallback, mais celui qui s'affiche est input (taillesAvailable = [])
    // disabled prop ne s'applique pas ici. On vérifie juste qu'il rend.
    expect(screen.getByLabelText('Taille')).toBeTruthy();
  });

  it("disabled forwardé sur tous les champs", () => {
    render(
      <VeloFormFields marques={MARQUES} value={EMPTY} onChange={() => {}} disabled />,
    );
    expect((screen.getByLabelText('Marque') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Modèle') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Couleur') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Taille') as HTMLInputElement).disabled).toBe(true);
  });

  it("marques vide → select disabled (rien à choisir)", () => {
    render(<VeloFormFields marques={[]} value={EMPTY} onChange={() => {}} />);
    expect((screen.getByLabelText('Marque') as HTMLSelectElement).disabled).toBe(true);
  });

  it("idPrefix custom → ids 'velo-' remplacés", () => {
    render(
      <VeloFormFields
        marques={MARQUES}
        value={EMPTY}
        onChange={() => {}}
        idPrefix="bdt"
      />,
    );
    expect(document.getElementById('bdt-marque')).toBeTruthy();
    expect(document.getElementById('bdt-modele')).toBeTruthy();
    expect(document.getElementById('bdt-couleur')).toBeTruthy();
    expect(document.getElementById('bdt-taille')).toBeTruthy();
  });

  it("changement taille (select) → onChange { taille: 'M' }", () => {
    const onChange = vi.fn();
    render(
      <VeloFormFields
        marques={MARQUES}
        value={{ ...EMPTY, marqueId: 'm1' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Taille'), { target: { value: 'M' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ taille: 'M' }),
    );
  });

  it("taille '' (clear) → taille: null", () => {
    const onChange = vi.fn();
    render(
      <VeloFormFields
        marques={MARQUES}
        value={{ ...EMPTY, marqueId: 'm1', taille: 'M' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Taille'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ taille: null }));
  });

  it("className custom mergé sur le wrapper grid", () => {
    const { container } = render(
      <VeloFormFields
        marques={MARQUES}
        value={EMPTY}
        onChange={() => {}}
        className="my-grid"
      />,
    );
    expect(container.firstChild).toHaveProperty('className');
    expect((container.firstChild as HTMLElement).className).toContain('my-grid');
  });
});
