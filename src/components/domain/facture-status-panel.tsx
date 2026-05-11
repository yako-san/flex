import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/pill';

export type FactureStatut = 'EMIS' | 'PAYE' | 'ANNULE';
export type ModePaiement = 'COMPTANT' | 'INTERAC' | 'CARTES' | 'CHEQUE' | 'AUTRE';

type Props = {
  factureNumero: string;
  date: Date | string;
  statut: FactureStatut;
  modePaiement: ModePaiement | null;
  grandTotal: number;
  /** URL du PDF (route API qui génère ou redirige). */
  pdfUrl?: string;
  /**
   * Slot pour brancher les boutons de changement de statut côté Phase 3
   * (server actions). Si absent, la zone droite ne montre que le statut.
   */
  statutControls?: React.ReactNode;
  className?: string;
};

const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

const fmtDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const statutVariant = (s: FactureStatut): React.ComponentProps<typeof Pill>['variant'] => {
  switch (s) {
    case 'PAYE': return 'on-bench';
    case 'ANNULE': return 'fini';
    default: return 'facture';
  }
};

const statutLabel = (s: FactureStatut) =>
  ({ EMIS: 'émise', PAYE: 'payée', ANNULE: 'annulée' }[s]);

const modeLabel = (m: ModePaiement | null) =>
  m == null
    ? '—'
    : ({
        COMPTANT: 'Comptant',
        INTERAC: 'Interac',
        CARTES: 'Cartes',
        CHEQUE: 'Chèque',
        AUTRE: 'Autre',
      }[m]);

/**
 * Encart facture émise V1 — affiché en tête de fiche BDT après émission.
 * Numéro + date + mode paiement + statut (Pill) + lien PDF + slot controls
 * pour changements de statut.
 */
export function FactureStatusPanel({
  factureNumero,
  date,
  statut,
  modePaiement,
  grandTotal,
  pdfUrl,
  statutControls,
  className,
}: Props) {
  return (
    <section
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gris-bord)] bg-[var(--gris-fond)] p-4',
        className,
      )}
      aria-label="Facture émise"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
          Facture
        </span>
        <span className="font-mono text-lg font-bold">{factureNumero}</span>
        <span className="text-sm text-[var(--text-secondary-70)]">{fmtDate(date)}</span>
        <span className="text-sm text-[var(--text-secondary-70)]">
          mode : <span className="font-semibold text-[var(--dark)]">{modeLabel(modePaiement)}</span>
        </span>
        <span className="font-mono text-sm font-bold">{fmt(grandTotal)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Pill variant={statutVariant(statut)}>{statutLabel(statut)}</Pill>
        {pdfUrl ? (
          <Link
            href={pdfUrl as never}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold text-[#1565c0] hover:underline"
          >
            PDF ↗
          </Link>
        ) : null}
        {statutControls}
      </div>
    </section>
  );
}
