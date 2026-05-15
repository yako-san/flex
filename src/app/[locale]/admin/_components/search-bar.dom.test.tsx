import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const replaceMock = vi.fn();
let pathnameMock = '/fr-CA/admin/clients';
let searchParamsMock = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock,
  useSearchParams: () => searchParamsMock,
}));

import { SearchBar } from './search-bar';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  replaceMock.mockClear();
  pathnameMock = '/fr-CA/admin/clients';
  searchParamsMock = new URLSearchParams();
});

describe('SearchBar', () => {
  it("rend un input search avec placeholder par défaut", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…') as HTMLInputElement;
    expect(input.type).toBe('search');
  });

  it("placeholder personnalisable", () => {
    render(<SearchBar placeholder="Cherche un vélo" />);
    expect(screen.getByPlaceholderText('Cherche un vélo')).toBeTruthy();
  });

  it("initialise la valeur depuis searchParams.q", () => {
    searchParamsMock = new URLSearchParams('q=salomon');
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…') as HTMLInputElement;
    expect(input.value).toBe('salomon');
  });

  it("valeur vide par défaut si pas de ?q=", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it("frappe → debounce 250ms → router.replace avec ?q=", () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: 'trek' } });
    expect(replaceMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(replaceMock).toHaveBeenCalledWith('/fr-CA/admin/clients?q=trek');
  });

  it("frappes successives → un seul router.replace (debounce)", () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'abc' } });
    vi.advanceTimersByTime(250);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fr-CA/admin/clients?q=abc');
  });

  it("vidage de l'input → router.replace sans ?q=", () => {
    vi.useFakeTimers();
    searchParamsMock = new URLSearchParams('q=trek');
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: '' } });
    vi.advanceTimersByTime(250);
    expect(replaceMock).toHaveBeenCalledWith('/fr-CA/admin/clients');
  });

  it("valeur trim (espaces) → trim avant insertion dans l'URL", () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: '  trek  ' } });
    vi.advanceTimersByTime(250);
    expect(replaceMock).toHaveBeenCalledWith('/fr-CA/admin/clients?q=trek');
  });

  it("valeur uniquement espaces → ?q= retiré", () => {
    vi.useFakeTimers();
    searchParamsMock = new URLSearchParams('q=old');
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: '   ' } });
    vi.advanceTimersByTime(250);
    expect(replaceMock).toHaveBeenCalledWith('/fr-CA/admin/clients');
  });

  it("préserve les autres params (sort, page, etc.)", () => {
    vi.useFakeTimers();
    searchParamsMock = new URLSearchParams('sort=name&page=2');
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(input, { target: { value: 'velo' } });
    vi.advanceTimersByTime(250);
    const url = replaceMock.mock.calls[0]![0] as string;
    expect(url).toContain('sort=name');
    expect(url).toContain('page=2');
    expect(url).toContain('q=velo');
  });
});
