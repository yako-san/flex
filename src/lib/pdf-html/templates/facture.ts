import {
  bottomCornersHtml,
  itemSectionHtml,
  logoHtml,
  metaHtml,
  workshopHtml,
} from './components';
import { SHARED_STYLES, escapeHtml, fmt$ } from './styles';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

export function buildFactureHtml(opts: {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo | null;
  factureNumero: string;
  date: Date;
  items: ItemRow[];
  totals: {
    totalServices: number;
    totalPieces: number;
    remises?: number;
    sousTotal: number;
    tps: number;
    tvq: number;
    grandTotal: number;
  };
  modePaiement: string | null;
  notes: string | null;
}): string {
  const services = opts.items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = opts.items.filter((it) => it.kind === 'PIECE');
  const dateStr = opts.date.toLocaleDateString('fr-CA');
  const remises = opts.totals.remises ?? 0;
  const taxesTotal = opts.totals.tps + opts.totals.tvq;
  const f = opts.workshop.fiscalEntity ?? {};
  const E = escapeHtml;

  const phoneLink = f.telephone ? E(f.telephone.replace(/\s+/g, '')) : '';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Facture ${E(opts.factureNumero)}</title>
    <style>${SHARED_STYLES}</style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        ${logoHtml(opts.workshop)}
        ${metaHtml({
          docLabel: 'reçu de vente',
          docDate: dateStr,
          docNumberLabel: 'facture',
          docNumber: opts.factureNumero,
          client: opts.client,
          velo: opts.velo,
        })}
      </div>
      ${workshopHtml(opts.workshop)}
      ${itemSectionHtml({ title: 'Services', bullet: '▸', items: services })}
      ${itemSectionHtml({ title: 'Pièces', bullet: '◆', items: pieces })}

      <div class="footer">
        <div class="footer-left">
          <p class="policy">
            Les retours considérés dans les trente jours suivant l&apos;achat. Retours
            pour crédit seulement. Les articles retournés seront crédités moyennant des
            frais de 15 % de remise en stock. Les items ouverts ou utilisés ne peuvent
            être retournés. Les articles soldés ne peuvent être retournés. Le prix des
            articles en commande spéciale est sujet à changer entre la date de la
            commande et de la réception de l&apos;article et sera facturé au prix le
            plus récent.
          </p>
          <p class="policy">
            Returns must be made within thirty days of purchase. Returns are accepted
            for store credit only. Returned items will be credited minus a 15 %
            restocking fee. Opened or used items cannot be returned. Sale items cannot
            be returned. The price of special-order items is subject to change between
            the date of order and the date of receipt, and will be billed at the most
            recent price.
          </p>
          <div class="tax-line">T.P.S : ${E(f.tps ?? '...')}</div>
          <div class="tax-line">T.V.Q : ${E(f.tvq ?? '...')}</div>

          ${f.footerText
            ? `<p class="payment-line">${E(f.footerText)}</p>`
            : `<p class="payment-line">
                Le paiement se fera <a class="payment-link" href="#">lors du retrait</a> ou avant${phoneLink ? `, par interac* au <a class="payment-link" href="#">${E(f.telephone ?? '')}</a>` : ''}. merci 💛
              </p>
              <p class="payment-note">
                * (comptant ou Interac) sont les deux seules méthodes pour éviter les
                frais de service. Les pourboires sont acceptés.
              </p>`}
          ${opts.modePaiement
            ? `<p class="payment-line">Mode de paiement : ${E(opts.modePaiement.toLowerCase())}.</p>`
            : ''}
          ${opts.notes ? `<div class="notes-block">${E(opts.notes)}</div>` : ''}
        </div>
        <div class="footer-right">
          <div class="totals">
            <div class="total-row">
              <span>Sous-total</span><span>${fmt$(opts.totals.sousTotal)}</span>
            </div>
            <div class="total-row">
              <span>Remises</span><span>${fmt$(remises)}</span>
            </div>
            <div class="total-row">
              <span>T.P.S : (5%)</span><span>${fmt$(opts.totals.tps)}</span>
            </div>
            <div class="total-row">
              <span>T.V.Q : (9.975%)</span><span>${fmt$(opts.totals.tvq)}</span>
            </div>
            <div class="total-row muted">
              <span>Total des taxes</span><span>${fmt$(taxesTotal)}</span>
            </div>
            <div class="total-grand"><span>Total</span><span>${fmt$(opts.totals.grandTotal)}</span></div>
          </div>
        </div>
      </div>

      ${bottomCornersHtml('modèle v2,5')}
    </div>
  </body>
</html>`;
}
