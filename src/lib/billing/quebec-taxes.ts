import { Decimal } from 'decimal.js';

// Taux légaux Québec (LTA art. 165 fédéral, LTVQ art. 16 provincial).
// À figer sur chaque facture émise (cf. FactureLog.taxRatesSnapshot).
export const TPS_RATE = new Decimal('0.05');
export const TVQ_RATE = new Decimal('0.09975');

export type TaxLine = {
  amount: Decimal;
  taxable: boolean;
};

export type TaxResult = {
  subtotal: Decimal;
  taxableBase: Decimal;
  tps: Decimal;
  tvq: Decimal;
  total: Decimal;
};

// Half-up au cent : règle ARC/RQ ($0.005 round up).
function roundHalfUpToCent(d: Decimal): Decimal {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calcQuebecTaxes(lines: TaxLine[]): TaxResult {
  const zero = new Decimal(0);
  let subtotal = zero;
  let taxableBase = zero;

  for (const l of lines) {
    subtotal = subtotal.plus(l.amount);
    if (l.taxable) taxableBase = taxableBase.plus(l.amount);
  }

  // Les deux taxes s'appliquent indépendamment sur le HT, pas TVQ sur (HT+TPS).
  const tps = roundHalfUpToCent(taxableBase.times(TPS_RATE));
  const tvq = roundHalfUpToCent(taxableBase.times(TVQ_RATE));
  const total = subtotal.plus(tps).plus(tvq);

  return { subtotal, taxableBase, tps, tvq, total };
}
