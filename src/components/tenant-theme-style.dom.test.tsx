import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TenantThemeStyle } from './tenant-theme-style';

afterEach(() => cleanup());

describe('TenantThemeStyle', () => {
  it("theme null → renvoie null (rien injecté)", () => {
    const { container } = render(<TenantThemeStyle theme={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("theme vide → renvoie null", () => {
    const { container } = render(<TenantThemeStyle theme={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('theme valide → injecte <style> dans :root par défaut', () => {
    const { container } = render(
      <TenantThemeStyle theme={{ jaune: '#fff056', rouge: '#d92020' }} />,
    );
    const style = container.querySelector('style');
    expect(style).toBeTruthy();
    expect(style?.textContent).toContain(':root');
    expect(style?.textContent).toContain('--jaune: #fff056;');
    expect(style?.textContent).toContain('--rouge: #d92020;');
  });

  it("scope custom appliqué", () => {
    const { container } = render(
      <TenantThemeStyle
        theme={{ jaune: '#000000' }}
        scope='[data-workshop="abc"]'
      />,
    );
    expect(container.querySelector('style')?.textContent).toContain(
      '[data-workshop="abc"]',
    );
  });

  it("valeurs invalides droppées (sanitizeTheme) → rien injecté", () => {
    const { container } = render(
      <TenantThemeStyle
        theme={{
          jaune: 'red', // invalide
          'evil-key': '#fff; alert(1)', // invalide
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('mix valide+invalide → injecte seulement les valides', () => {
    const { container } = render(
      <TenantThemeStyle
        theme={{
          jaune: '#fff056', // valide
          rouge: 'red', // invalide
        }}
      />,
    );
    const css = container.querySelector('style')?.textContent;
    expect(css).toContain('--jaune: #fff056;');
    expect(css).not.toContain('--rouge:');
  });

  it("CSS injection bloquée (sanitize → rien)", () => {
    const { container } = render(
      <TenantThemeStyle theme={{ jaune: '#fff; } body { display:none } a {' }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('theme avec rgba() accepté', () => {
    const { container } = render(
      <TenantThemeStyle theme={{ jaune: 'rgba(255,240,86,0.5)' }} />,
    );
    expect(container.querySelector('style')?.textContent).toContain(
      'rgba(255,240,86,0.5)',
    );
  });

  it("non-objet → rien injecté", () => {
    const { container } = render(<TenantThemeStyle theme={'not-an-object'} />);
    expect(container.firstChild).toBeNull();
  });
});
