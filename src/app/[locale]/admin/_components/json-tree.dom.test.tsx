import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

import { JsonTree } from './json-tree';

describe('JsonTree', () => {
  it("valeur string affichée entre guillemets", () => {
    render(<JsonTree data="hello" />);
    expect(screen.getByText(/"hello"/)).toBeTruthy();
  });

  it("valeur number colorée", () => {
    render(<JsonTree data={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it("valeur boolean true affiché", () => {
    render(<JsonTree data={true} />);
    expect(screen.getByText('true')).toBeTruthy();
  });

  it("valeur null affiché", () => {
    render(<JsonTree data={null} />);
    expect(screen.getByText('null')).toBeTruthy();
  });

  it("objet vide → '{ }' ou '{}'", () => {
    render(<JsonTree data={{}} />);
    expect(screen.getByText(/\{\}/)).toBeTruthy();
  });

  it("objet avec clés → résumé '{ N }' visible", () => {
    render(<JsonTree data={{ a: 1, b: 2 }} />);
    expect(screen.getByText(/\{ 2 \}/)).toBeTruthy();
  });

  it("objet expanded par défaut à depth 0 → clé 'a' visible", () => {
    render(<JsonTree data={{ a: 1 }} />);
    expect(screen.getByText('a')).toBeTruthy();
  });

  it("toggle expand/collapse sur clic du bouton résumé", () => {
    render(<JsonTree data={{ x: 'hello' }} defaultExpanded={true} />);
    // x doit être visible avant collapse
    expect(screen.getByText('x')).toBeTruthy();
    // Cliquer sur le bouton pour refermer
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(screen.queryByText('x')).toBeNull();
  });

  it("tableau → résumé '[ N ]'", () => {
    render(<JsonTree data={[1, 2, 3]} />);
    expect(screen.getByText(/\[ 3 \]/)).toBeTruthy();
  });

  it("tableau vide → '[]'", () => {
    render(<JsonTree data={[]} />);
    expect(screen.getByText('[]')).toBeTruthy();
  });
});
