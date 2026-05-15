import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Piece } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createPieceAction: vi.fn().mockResolvedValue(null),
  updatePieceAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { PieceForm } from './piece-form';

const FULL_PIECE = {
  id: 'p1',
  workshopId: 'w1',
  nomCanonical: 'Schwalbe, Marathon, 700C x 35',
  legacyCode: 'P00001',
  sku: '79-347',
  codeBarre: null,
  categorie: '2. Transmission',
  fournisseur: 'Babac',
  groupe: '11-vit',
  notes: 'Lot mars',
  prixAchat: '12.50',
  prixBase: '15.00',
  prixVente: '18.00',
  prixCost: '13.00',
  prixBdc: '17.00',
  taxable: true,
  stockPhysique: 5,
  stockReserve: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as Piece;

describe('PieceForm', () => {
  it("mode création → bouton 'Créer la pièce'", () => {
    render(<PieceForm />);
    expect(screen.getByRole('button', { name: /Créer la pièce/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<PieceForm initial={FULL_PIECE} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it('nomCanonical est required', () => {
    const { container } = render(<PieceForm />);
    const input = container.querySelector('input[name="nomCanonical"]') as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  it('prixVente est required, type=number, min=0, step=0.01', () => {
    const { container } = render(<PieceForm />);
    const input = container.querySelector('input[name="prixVente"]') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.type).toBe('number');
    expect(input.min).toBe('0');
    expect(input.step).toBe('0.01');
  });

  it('taxable coché par défaut en création', () => {
    const { container } = render(<PieceForm />);
    const checkbox = container.querySelector('input[name="taxable"]') as HTMLInputElement;
    expect(checkbox.defaultChecked).toBe(true);
  });

  it('stockPhysique type=number, min=0, defaultValue=0', () => {
    const { container } = render(<PieceForm />);
    const stock = container.querySelector('input[name="stockPhysique"]') as HTMLInputElement;
    expect(stock.type).toBe('number');
    expect(stock.min).toBe('0');
    expect(Number(stock.defaultValue)).toBe(0);
  });

  it('stockReserve type=number, min=0, defaultValue=0', () => {
    const { container } = render(<PieceForm />);
    const stock = container.querySelector('input[name="stockReserve"]') as HTMLInputElement;
    expect(stock.type).toBe('number');
    expect(stock.min).toBe('0');
    expect(Number(stock.defaultValue)).toBe(0);
  });

  it('initial pré-remplit nomCanonical', () => {
    const { container } = render(<PieceForm initial={FULL_PIECE} />);
    const input = container.querySelector('input[name="nomCanonical"]') as HTMLInputElement;
    expect(input.defaultValue).toBe('Schwalbe, Marathon, 700C x 35');
  });

  it('initial pré-remplit sku et categorie', () => {
    const { container } = render(<PieceForm initial={FULL_PIECE} />);
    expect((container.querySelector('input[name="sku"]') as HTMLInputElement).defaultValue).toBe('79-347');
    expect((container.querySelector('input[name="categorie"]') as HTMLInputElement).defaultValue).toBe('2. Transmission');
  });

  it('placeholder nomCanonical contient le format attendu', () => {
    const { container } = render(<PieceForm />);
    const input = container.querySelector('input[name="nomCanonical"]') as HTMLInputElement;
    expect(input.placeholder).toContain('Schwalbe');
  });

  it('section Identification et section Prix présentes', () => {
    render(<PieceForm />);
    expect(screen.getByText('Identification')).toBeTruthy();
    expect(screen.getByText('Prix')).toBeTruthy();
    expect(screen.getByText('Stock')).toBeTruthy();
  });
});
