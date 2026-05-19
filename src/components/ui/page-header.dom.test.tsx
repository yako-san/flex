import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';

afterEach(() => cleanup());

describe('PageHeader (text-bg par ligne)', () => {
  it('rend <header> + <h1> avec title', () => {
    render(<PageHeader title="Mon titre" />);
    expect(screen.getByRole('banner')).toBeTruthy(); // <header>
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mon titre');
  });

  it('title peut être un ReactNode (JSX)', () => {
    render(<PageHeader title={<span>X</span>} />);
    expect(screen.getByRole('heading', { level: 1 }).querySelector('span')).toBeTruthy();
  });

  it('eyebrow rendu lowercase dans sa propre plaque grise', () => {
    render(<PageHeader title="x" eyebrow="vélos en atelier" />);
    const el = screen.getByText('vélos en atelier');
    expect(el.style.textTransform).toBe('lowercase');
    expect(el.style.background).toContain('--app-bg');
  });

  it("pas d'eyebrow si non fourni", () => {
    render(<PageHeader title="x" />);
    expect(screen.queryByText(/^vélos/)).toBeNull();
  });

  it('help=true rend la pastille `?` jaune', () => {
    render(<PageHeader title="x" help />);
    const badge = screen.getByText('?');
    expect(badge.getAttribute('role')).toBe('img');
    expect(badge.style.background).toContain('--jaune');
  });

  it('help="texte" rend la pastille avec tooltip + aria-label', () => {
    render(<PageHeader title="x" help="Cliquez ici pour la doc" />);
    const badge = screen.getByLabelText('Cliquez ici pour la doc');
    expect(badge.getAttribute('title')).toBe('Cliquez ici pour la doc');
  });

  it('help non fourni → pas de pastille', () => {
    render(<PageHeader title="x" />);
    expect(screen.queryByText('?')).toBeNull();
  });

  it('subline rendu dans sa propre plaque sous le titre', () => {
    render(<PageHeader title="x" subline="32 BDT actifs" />);
    const el = screen.getByText('32 BDT actifs');
    expect(el.style.background).toContain('--app-bg');
  });

  it('actions rendus dans la zone droite', () => {
    render(
      <PageHeader
        title="x"
        actions={
          <>
            <button>A</button>
            <button>B</button>
          </>
        }
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it("sticky=true par défaut → classe 'sticky top-0'", () => {
    render(<PageHeader title="x" />);
    const cls = screen.getByRole('banner').className;
    expect(cls).toContain('sticky');
    expect(cls).toContain('top-0');
  });

  it("sticky=false → pas de classe sticky", () => {
    render(<PageHeader title="x" sticky={false} />);
    expect(screen.getByRole('banner').className).not.toContain('sticky');
  });

  it('className custom mergé', () => {
    render(<PageHeader title="x" className="my-extra" />);
    expect(screen.getByRole('banner').className).toContain('my-extra');
  });

  it('plus de bg gris-bg sur le header (déplacé sur les plaques par ligne)', () => {
    render(<PageHeader title="x" eyebrow="e" subline="s" />);
    const cls = screen.getByRole('banner').className;
    expect(cls).not.toContain('bg-[var(--gris-bg)]');
    expect(cls).not.toContain('border-b');
  });

  it('H1 weight 300 et color jaune (signature V1)', () => {
    render(<PageHeader title="Inventaire" />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.style.fontWeight).toBe('300');
    expect(h1.style.color).toContain('--jaune');
  });
});
