import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ClientAutocomplete,
  type ClientSuggestion,
} from './client-autocomplete';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const SUGGESTIONS: ClientSuggestion[] = [
  {
    id: 'c1',
    prenom: 'Marie',
    nom: 'Tremblay',
    telephone: '5145551234',
    courriel: null,
  },
  {
    id: 'c2',
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: null,
    courriel: 'jean@x.com',
  },
];

function mkSearch(results: ClientSuggestion[] = SUGGESTIONS) {
  return vi.fn(async () => results);
}

describe('ClientAutocomplete', () => {
  it("rend un input role=combobox + placeholder", () => {
    render(<ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).placeholder).toBe('Rechercher un client…');
  });

  it("placeholder custom", () => {
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={null}
        onChange={() => {}}
        placeholder="Cherche client"
      />,
    );
    expect((screen.getByRole('combobox') as HTMLInputElement).placeholder).toBe(
      'Cherche client',
    );
  });

  it("value pré-rempli → input affiche 'prenom nom'", () => {
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={{ id: 'c', prenom: 'Marie', nom: 'Tremblay' }}
        onChange={() => {}}
      />,
    );
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
      'Marie Tremblay',
    );
  });

  it("focus ouvre le dropdown (aria-expanded=true)", () => {
    render(<ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />);
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true');
  });

  it("query < 2 chars → pas de search ni listbox", async () => {
    const search = mkSearch();
    render(
      <ClientAutocomplete search={search} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(search).not.toHaveBeenCalled();
  });

  it("query >= 2 chars + debounce → search appelée", async () => {
    const search = mkSearch();
    render(
      <ClientAutocomplete search={search} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(search).toHaveBeenCalledWith('mar');
  });

  it("debounce respecté : 2 changements rapides → 1 seul call", async () => {
    const search = mkSearch();
    render(
      <ClientAutocomplete search={search} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ma' } });
    await vi.advanceTimersByTimeAsync(100);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('mar');
  });

  it("suggestions affichées en listbox avec role=option", async () => {
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it("affiche prénom + nom + telephone ou courriel par suggestion", async () => {
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      expect(screen.getByText('Marie Tremblay')).toBeTruthy();
    });
    expect(screen.getByText('5145551234')).toBeTruthy();
    expect(screen.getByText('jean@x.com')).toBeTruthy();
  });

  it("aucun résultat → message 'Aucun résultat'", async () => {
    render(
      <ClientAutocomplete
        search={mkSearch([])}
        value={null}
        onChange={() => {}}
      />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      expect(screen.getByText('Aucun résultat')).toBeTruthy();
    });
  });

  it("clic suggestion → onChange + remplit input + ferme", async () => {
    const onChange = vi.fn();
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={onChange} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => screen.getByText('Marie Tremblay'));
    fireEvent.click(screen.getByText('Marie Tremblay'));
    expect(onChange).toHaveBeenCalledWith(SUGGESTIONS[0]);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
      'Marie Tremblay',
    );
  });

  it("flèche bas / haut navigue dans la liste (aria-selected)", async () => {
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => screen.getAllByRole('option'));

    // index initial = 0
    let opts = screen.getAllByRole('option');
    expect(opts[0]!.getAttribute('aria-selected')).toBe('true');

    // ArrowDown → index 1
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    opts = screen.getAllByRole('option');
    expect(opts[1]!.getAttribute('aria-selected')).toBe('true');

    // ArrowDown → bornage à index 1 (max)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    opts = screen.getAllByRole('option');
    expect(opts[1]!.getAttribute('aria-selected')).toBe('true');

    // ArrowUp → revenir à index 0
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    opts = screen.getAllByRole('option');
    expect(opts[0]!.getAttribute('aria-selected')).toBe('true');
  });

  it("Enter sélectionne l'option active", async () => {
    const onChange = vi.fn();
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={onChange} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mar' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => screen.getAllByRole('option'));
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(SUGGESTIONS[0]);
  });

  it("Escape ferme la liste", async () => {
    render(
      <ClientAutocomplete search={mkSearch()} value={null} onChange={() => {}} />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it("bouton 'Effacer' (X) → onChange(null) + reset input", () => {
    const onChange = vi.fn();
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={{ id: 'c', prenom: 'X', nom: 'Y' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Effacer'));
    expect(onChange).toHaveBeenCalledWith(null);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('');
  });

  it("changer le query après value → onChange(null) (déselection auto)", () => {
    const onChange = vi.fn();
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={{ id: 'c', prenom: 'Marie', nom: 'Tremblay' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Marie ' },
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("createSlot rendu sous la liste si fourni", async () => {
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={null}
        onChange={() => {}}
        createSlot={(q) => <button data-testid="create">Créer "{q}"</button>}
      />,
    );
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nouveau' } });
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => {
      expect(screen.getByTestId('create')).toBeTruthy();
    });
    expect(screen.getByText(/Créer "nouveau"/)).toBeTruthy();
  });

  it("disabled forwardé sur l'input", () => {
    render(
      <ClientAutocomplete
        search={mkSearch()}
        value={null}
        onChange={() => {}}
        disabled
      />,
    );
    expect((screen.getByRole('combobox') as HTMLInputElement).disabled).toBe(true);
  });
});
