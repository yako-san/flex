import { escapeHtml, fmt$ } from './styles';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

const E = escapeHtml;

export function logoHtml(workshop: WorkshopInfo): string {
  if (workshop.logoBase64) {
    return `<div class="logo"><img src="${workshop.logoBase64}" alt="${E(workshop.name)}" /></div>`;
  }
  return `<div class="logo"><span style="font-size: 11pt; font-weight: 700; text-align: center; padding: 6px;">${E(workshop.name)}</span></div>`;
}

export function metaHtml(opts: {
  docLabel: string;
  docDate: string;
  docNumberLabel: string;
  docNumber: string;
  client: ClientInfo;
  velo: VeloInfo | null;
}): string {
  const veloLine = opts.velo
    ? [opts.velo.marque, opts.velo.modele, opts.velo.couleur, opts.velo.taille]
        .filter(Boolean)
        .join(', ') || '—'
    : null;
  const clientLine = `${opts.client.prenom} ${opts.client.nom}`.trim() || '—';
  return `
    <div class="meta">
      <div class="meta-label">${E(opts.docLabel)}</div>
      <div class="meta-value">${E(opts.docDate)}</div>
      <div class="meta-label">${E(opts.docNumberLabel)}</div>
      <div class="meta-value">${E(opts.docNumber)}</div>
      ${veloLine ? `<div class="meta-label">vélo</div><div class="meta-value">${E(veloLine)}</div>` : ''}
      <div class="meta-label">client</div>
      <div class="meta-value">${E(clientLine)}</div>
      ${opts.client.courriel ? `<div class="meta-label">contact</div><div class="meta-value">${E(opts.client.courriel)}</div>` : ''}
    </div>
  `;
}

export function workshopHtml(workshop: WorkshopInfo): string {
  const f = workshop.fiscalEntity ?? {};
  const cityLine = [f.ville, f.province, f.codePostal].filter(Boolean).join(' ');
  const lines: string[] = [];
  if (f.raisonSociale) lines.push(`<div class="workshop-name">${E(f.raisonSociale)}</div>`);
  if (f.tagline) lines.push(`<div class="workshop-tagline">${E(f.tagline)}</div>`);
  if (f.adresseLigne1) lines.push(`<div class="workshop-line">${E(f.adresseLigne1)}</div>`);
  if (f.adresseLigne2) lines.push(`<div class="workshop-line">${E(f.adresseLigne2)}</div>`);
  if (cityLine) lines.push(`<div class="workshop-line">${E(cityLine)}</div>`);
  const contactLines: string[] = [];
  if (f.courriel) contactLines.push(`<div class="workshop-line">${E(f.courriel)}</div>`);
  if (f.telephone) contactLines.push(`<div class="workshop-line">${E(f.telephone)}</div>`);
  if (contactLines.length > 0) {
    lines.push(`<div class="workshop-contact">${contactLines.join('')}</div>`);
  }
  return `<div class="workshop">${lines.join('')}</div>`;
}

export function itemSectionHtml(opts: {
  title: string;
  bullet: string;
  items: ItemRow[];
  hidePrices?: boolean;
}): string {
  if (opts.items.length === 0) return '';
  const rows = opts.items
    .map((it) => {
      const priceCells = opts.hidePrices
        ? ''
        : `
        <td class="col-num">${fmt$(it.unitPrice)}</td>
        <td class="col-qty">${it.qty}</td>
        <td class="col-num">${fmt$(it.total)}</td>
      `;
      const skuLine = it.sku ? `<div class="item-sku">SKU ${E(it.sku)}</div>` : '';
      return `
        <tr>
          <td class="col-bullet">${opts.bullet}</td>
          <td class="col-label">${E(it.label)}${skuLine}</td>
          ${priceCells}
        </tr>
      `;
    })
    .join('');
  const headerCells = opts.hidePrices
    ? ''
    : `
      <th class="col-num">unitaire</th>
      <th class="col-qty">qté</th>
      <th class="col-num">prix</th>
    `;
  return `
    <h2 class="section-title">${E(opts.title)}</h2>
    <table class="items">
      <thead>
        <tr>
          <th class="col-bullet"></th>
          <th class="col-label"></th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function bottomCornersHtml(version: string): string {
  return `
    <div class="bottom-corners">
      <div>${E(version)}</div>
      <div class="thanks">Merci et bonne route 🚴</div>
    </div>
  `;
}
