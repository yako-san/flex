import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';

afterEach(() => cleanup());

describe('PageHeader', () => {
  it('rend <header> + <h1> avec title', () => {
    render(<PageHeader title="Mon titre" />);
    expect(screen.getByRole('banner')).toBeTruthy(); // <header>
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mon titre');
  });

  it("title peut être un ReactNode (JSX)", () => {
    render(<PageHeader title={<span>X</span>} />);
    expect(screen.getByRole('heading', { level: 1 }).querySelector('span')).toBeTruthy();
  });

  it("eyebrow rendu en slug italique pâle V1 (pas uppercase tracking)", () => {
    render(<PageHeader title="x" eyebrow="vélos en atelier" />);
    const p = screen.getByText('vélos en atelier');
    expect(p.className).toContain('italic');
    expect(p.className).not.toContain('uppercase');
    expect(p.className).not.toContain('tracking-widest');
  });

  it("pas d'eyebrow si non fourni", () => {
    const { container } = render(<PageHeader title="x" />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('hint affiché à côté du titre', () => {
    render(<PageHeader title="x" hint="(5 actifs)" />);
    expect(screen.getByText('(5 actifs)')).toBeTruthy();
  });

  it('subline rendu sous le titre', () => {
    render(<PageHeader title="x" subline="32 BDT actifs sur 100" />);
    expect(screen.getByText('32 BDT actifs sur 100')).toBeTruthy();
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

  it("border-b + fond gris-bg (classes communes)", () => {
    render(<PageHeader title="x" />);
    const cls = screen.getByRole('banner').className;
    expect(cls).toContain('border-b');
    expect(cls).toContain('gris-bg');
  });
});
