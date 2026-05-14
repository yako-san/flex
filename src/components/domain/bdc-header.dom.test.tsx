import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BDCHeader, type BDCHeaderProps } from './bdc-header';

afterEach(() => cleanup());

const MECANOS = [
  { id: 'm1', nom: 'Yako' },
  { id: 'm2', nom: 'Joe' },
];

const BASE: BDCHeaderProps = {
  locale: 'fr-CA',
  bdcNumero: 42,
  veloNumero: 7,
  client: { id: 'c1', prenom: 'Marie', nom: 'Tremblay' },
  velo: { marque: 'Trek', modele: '7300', couleur: 'rouge' },
  evalStatus: 'INDECIS',
  archiveStatus: 'ACTIF',
  mecanos: MECANOS,
  evalMecanoId: null,
  mecaMecanoId: null,
  ctrlMecanoId: null,
  cbEvalEnvoye: false,
  cbEval: false,
  cbBonSortie: false,
  cbArchiver: false,
};

describe('BDCHeader', () => {
  it("rend <header> sticky top-0 z-30", () => {
    render(<BDCHeader {...BASE} />);
    const h = screen.getByRole('banner');
    expect(h.className).toContain('sticky');
    expect(h.className).toContain('top-0');
  });

  it("affiche bdcNumero paddé 4 chiffres", () => {
    render(<BDCHeader {...BASE} bdcNumero={1} />);
    expect(screen.getByText('0001')).toBeTruthy();
  });

  it("affiche veloNumero préfixé 'vélo' paddé", () => {
    render(<BDCHeader {...BASE} veloNumero={123} />);
    expect(screen.getByText('vélo 0123')).toBeTruthy();
  });

  it("client présent → link vers /admin/clients/[id]", () => {
    render(<BDCHeader {...BASE} />);
    const link = screen.getByText('Marie Tremblay');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/fr-CA/admin/clients/c1');
  });

  it("client null → 'walk-in' affiché en gris", () => {
    render(<BDCHeader {...BASE} client={null} />);
    expect(screen.getByText('walk-in')).toBeTruthy();
  });

  it("velo marque + modele + couleur joints", () => {
    render(<BDCHeader {...BASE} />);
    expect(screen.getByText('Trek, 7300, rouge')).toBeTruthy();
  });

  it("velo champs partiels filtrés (filter Boolean)", () => {
    render(
      <BDCHeader {...BASE} velo={{ marque: 'Trek', modele: null, couleur: null }} />,
    );
    expect(screen.getByText('Trek')).toBeTruthy();
  });

  it("velo null → pas d'affichage vélo line", () => {
    render(<BDCHeader {...BASE} velo={null} />);
    expect(screen.queryByText(/Trek/)).toBeNull();
  });

  it("evalStatus en lowercase dans Pill", () => {
    render(<BDCHeader {...BASE} evalStatus="APPROUVE" />);
    expect(screen.getByText('approuve')).toBeTruthy();
  });

  it("archiveStatus 'ARCHIVE_FACTURE' → label 'facture'", () => {
    render(<BDCHeader {...BASE} archiveStatus="ARCHIVE_FACTURE" />);
    expect(screen.getByText('facture')).toBeTruthy();
  });

  it("archiveStatus 'ARCHIVE_A_FACTURER' → label 'a facturer'", () => {
    render(<BDCHeader {...BASE} archiveStatus="ARCHIVE_A_FACTURER" />);
    expect(screen.getByText('a facturer')).toBeTruthy();
  });

  it("archiveStatus 'ACTIF' → label 'actif'", () => {
    render(<BDCHeader {...BASE} archiveStatus="ACTIF" />);
    expect(screen.getByText('actif')).toBeTruthy();
  });

  it("3 labels MecanoRow : Éval / Méca / Ctrl", () => {
    render(<BDCHeader {...BASE} />);
    expect(screen.getByText('Éval')).toBeTruthy();
    expect(screen.getByText('Méca')).toBeTruthy();
    expect(screen.getByText('Ctrl')).toBeTruthy();
  });

  it("4 labels WorkflowCheck", () => {
    render(<BDCHeader {...BASE} />);
    expect(screen.getByText('Évaluation envoyée')).toBeTruthy();
    expect(screen.getByText('OK')).toBeTruthy();
    expect(screen.getByText('Bon de sortie')).toBeTruthy();
    expect(screen.getByText('Archiver')).toBeTruthy();
  });

  it("mecanoSelect slot appelé pour chaque rôle avec selectedId", () => {
    const slots: string[] = [];
    render(
      <BDCHeader
        {...BASE}
        evalMecanoId="m1"
        mecaMecanoId="m2"
        mecanoSelect={(role, id) => {
          slots.push(`${role}:${id ?? 'null'}`);
          return <span data-testid={`slot-${role}`}>{role}={id}</span>;
        }}
      />,
    );
    expect(slots).toEqual(['eval:m1', 'meca:m2', 'ctrl:null']);
    expect(screen.getByTestId('slot-eval')).toBeTruthy();
    expect(screen.getByTestId('slot-meca')).toBeTruthy();
    expect(screen.getByTestId('slot-ctrl')).toBeTruthy();
  });

  it("workflowCheckbox slot appelé pour les 4 keys", () => {
    const calls: string[] = [];
    render(
      <BDCHeader
        {...BASE}
        cbEval={true}
        workflowCheckbox={(key, checked) => {
          calls.push(`${key}:${checked}`);
          return <span data-testid={`cb-${key}`}>{key}</span>;
        }}
      />,
    );
    expect(calls).toEqual([
      'cbEvalEnvoye:false',
      'cbEval:true',
      'cbBonSortie:false',
      'cbArchiver:false',
    ]);
  });

  it("actions slot rendu à droite", () => {
    render(
      <BDCHeader
        {...BASE}
        actions={<button data-testid="action-btn">Test</button>}
      />,
    );
    expect(screen.getByTestId('action-btn')).toBeTruthy();
  });

  it("pas d'erreur si actions absent", () => {
    render(<BDCHeader {...BASE} />);
    expect(screen.getByRole('banner')).toBeTruthy();
  });
});
