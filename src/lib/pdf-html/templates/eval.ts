import {
  bottomCornersHtml,
  itemSectionHtml,
  logoHtml,
  metaHtml,
  workshopHtml,
} from './components';
import { SHARED_STYLES, escapeHtml, fmt$ } from './styles';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

export function buildEvalHtml(opts: {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo;
  bdcId: string;
  date: Date;
  items: ItemRow[];
  totalServices: number;
  totalPieces: number;
  remises?: number;
  notes: string | null;
}): string {
  const services = opts.items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = opts.items.filter((it) => it.kind === 'PIECE');
  const remises = opts.remises ?? 0;
  const totalHt = opts.totalServices + opts.totalPieces - remises;
  const dateStr = opts.date.toLocaleDateString('fr-CA');
  const E = escapeHtml;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Évaluation ${E(opts.bdcId.slice(-4))}</title>
    <style>${SHARED_STYLES}</style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        ${logoHtml(opts.workshop)}
        ${metaHtml({
          docLabel: 'évaluation',
          docDate: dateStr,
          docNumberLabel: 'bon de travail',
          docNumber: opts.bdcId.slice(-4),
          client: opts.client,
          velo: opts.velo,
        })}
      </div>
      ${workshopHtml(opts.workshop)}
      ${itemSectionHtml({ title: 'Services', bullet: '▸', items: services })}
      ${itemSectionHtml({ title: 'Pièces', bullet: '◆', items: pieces })}

      <div class="footer">
        <div class="footer-left">
          ${opts.notes ? `<div class="notes-block">${E(opts.notes)}</div>` : ''}
          <p class="payment-line">
            Cette évaluation est valable 30 jours. Les taxes seront ajoutées à la
            facturation finale.
          </p>
          <div class="signature">
            <div>Approuvé par le client (signature) :</div>
            <div class="signature-line"></div>
          </div>
        </div>
        <div class="footer-right">
          <div class="totals">
            <div class="total-row">
              <span>Sous-total services</span><span>${fmt$(opts.totalServices)}</span>
            </div>
            <div class="total-row">
              <span>Sous-total pièces</span><span>${fmt$(opts.totalPieces)}</span>
            </div>
            ${remises > 0
              ? `<div class="total-row"><span>Remises</span><span>−${fmt$(remises)}</span></div>`
              : ''}
            <div class="total-grand"><span>Total estimé HT</span><span>${fmt$(totalHt)}</span></div>
          </div>
        </div>
      </div>

      ${bottomCornersHtml('modèle v2,5')}
    </div>
  </body>
</html>`;
}
