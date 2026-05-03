import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { calcQuebecTaxes, type TaxLine } from './quebec-taxes';

const dec = (s: string | number) => new Decimal(s);
const eq = (actual: Decimal, expected: string) =>
  expect(actual.toFixed(2)).toBe(expected);

describe('calcQuebecTaxes', () => {
  describe('cas vides / dégénérés', () => {
    it('renvoie zéro pour une liste vide', () => {
      const r = calcQuebecTaxes([]);
      eq(r.subtotal, '0.00');
      eq(r.tps, '0.00');
      eq(r.tvq, '0.00');
      eq(r.total, '0.00');
    });

    it('aucune taxe quand toutes les lignes sont non-taxables', () => {
      const lines: TaxLine[] = [
        { amount: dec('50.00'), taxable: false },
        { amount: dec('25.00'), taxable: false },
      ];
      const r = calcQuebecTaxes(lines);
      eq(r.subtotal, '75.00');
      eq(r.tps, '0.00');
      eq(r.tvq, '0.00');
      eq(r.total, '75.00');
    });
  });

  describe('calcul nominal', () => {
    it('ligne unique 100.00 taxable → TPS 5.00 / TVQ 9.98 (arrondi)', () => {
      // 100 * 0.05 = 5.00
      // 100 * 0.09975 = 9.975 → 9.98 (half-up sur le 3e décimal)
      const r = calcQuebecTaxes([{ amount: dec('100.00'), taxable: true }]);
      eq(r.subtotal, '100.00');
      eq(r.tps, '5.00');
      eq(r.tvq, '9.98');
      eq(r.total, '114.98');
    });

    it('plusieurs lignes : taxes calculées sur la SOMME, pas ligne par ligne', () => {
      // Deux lignes 50.005 (impossible en pratique mais teste la règle)
      // Si on calculait par ligne : 2 * round(50.005 * 0.05) = 2 * round(2.50025) = 2 * 2.50 = 5.00
      // Calculé sur somme    : round(100.01 * 0.05) = round(5.0005) = 5.00
      // Ici les deux donnent pareil ; on prend un cas qui diverge :
      // 3 lignes de 33.33 :
      //   par ligne TPS : 3 * round(33.33 * 0.05) = 3 * round(1.6665) = 3 * 1.67 = 5.01
      //   sur somme TPS : round(99.99 * 0.05) = round(4.9995) = 5.00
      const r = calcQuebecTaxes([
        { amount: dec('33.33'), taxable: true },
        { amount: dec('33.33'), taxable: true },
        { amount: dec('33.33'), taxable: true },
      ]);
      eq(r.subtotal, '99.99');
      eq(r.tps, '5.00'); // pas 5.01
    });
  });

  describe('mix taxable / non-taxable', () => {
    it('taxes appliquées seulement sur les lignes taxables', () => {
      // 100 taxable + 50 non-taxable
      // subtotal = 150, TPS = 5.00 (sur 100), TVQ = 9.98 (sur 100)
      const r = calcQuebecTaxes([
        { amount: dec('100.00'), taxable: true },
        { amount: dec('50.00'), taxable: false },
      ]);
      eq(r.subtotal, '150.00');
      eq(r.tps, '5.00');
      eq(r.tvq, '9.98');
      eq(r.total, '164.98');
    });
  });

  describe('arrondi half-up au cent par taxe (LTA / LTVQ)', () => {
    it('TPS sur 0.10 → 0.005 round up à 0.01', () => {
      const r = calcQuebecTaxes([{ amount: dec('0.10'), taxable: true }]);
      eq(r.tps, '0.01');
    });

    it('TVQ sur 1.00 → 0.09975 round up à 0.10', () => {
      const r = calcQuebecTaxes([{ amount: dec('1.00'), taxable: true }]);
      eq(r.tvq, '0.10');
    });

    it('TPS sur 0.04 → 0.002 round down à 0.00', () => {
      const r = calcQuebecTaxes([{ amount: dec('0.04'), taxable: true }]);
      eq(r.tps, '0.00');
    });

    it('TPS sur 0.10 puis TVQ : taxes arrondies indépendamment, pas en cascade', () => {
      // TPS et TVQ calculées TOUTES DEUX sur le HT (100), pas TVQ sur (HT+TPS)
      const r = calcQuebecTaxes([{ amount: dec('100.00'), taxable: true }]);
      // Régression : si on faisait TVQ sur (100 + 5) on aurait 10.47 au lieu de 9.98
      eq(r.tvq, '9.98');
    });
  });

  describe('cas réels facturation atelier', () => {
    it('BDT typique : main d\'œuvre 80 + pièce 45.50', () => {
      const r = calcQuebecTaxes([
        { amount: dec('80.00'), taxable: true }, // service
        { amount: dec('45.50'), taxable: true }, // pièce
      ]);
      // subtotal = 125.50
      // TPS = round(125.50 * 0.05) = round(6.275) = 6.28
      // TVQ = round(125.50 * 0.09975) = round(12.518625) = 12.52
      // total = 125.50 + 6.28 + 12.52 = 144.30
      eq(r.subtotal, '125.50');
      eq(r.tps, '6.28');
      eq(r.tvq, '12.52');
      eq(r.total, '144.30');
    });
  });
});
