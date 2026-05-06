// CSS partagé pour tous les templates PDF. Matché au modèle v2.5 yako-cyclo.
// Format Letter (8.5"x11") = 816x1056 px @ 96 dpi.

export const SHARED_STYLES = `
@import url('https://rsms.me/inter/inter.css');

@page {
  size: Letter;
  margin: 0;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
  color: #1a1a1a;
  font-size: 9.5pt;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}

.page {
  width: 8.5in;
  min-height: 11in;
  padding: 0.4in 0.5in 0.5in 0.5in;
  position: relative;
  page-break-after: always;
}

.page:last-child { page-break-after: auto; }

/* === Header (logo top-left + meta top-right) === */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.logo {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  background: #fcd900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.logo img { width: 100%; height: 100%; object-fit: contain; }

.meta {
  text-align: right;
  font-size: 9.5pt;
  line-height: 1.3;
}
.meta-label {
  color: #888;
  font-size: 8.5pt;
  margin-top: 6px;
}
.meta-label:first-child { margin-top: 0; }
.meta-value {
  font-weight: 700;
  font-size: 10pt;
  margin-top: 1px;
}

/* === Workshop block (sous le logo) === */
.workshop {
  margin-top: 14px;
  font-size: 9.5pt;
  line-height: 1.45;
}
.workshop-name { font-weight: 700; }
.workshop-tagline { color: #555; margin-bottom: 6px; }
.workshop-line { color: #1a1a1a; }
.workshop-contact { margin-top: 6px; }

/* === Sections (SERVICES / PIÈCES) === */
.section-title {
  font-weight: 700;
  font-size: 10.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 28px 0 6px 0;
}

.items {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
}
.items thead th {
  font-weight: 400;
  font-size: 8pt;
  color: #888;
  padding: 4px 4px;
  text-align: right;
  border-bottom: 1pt solid #1a1a1a;
}
.items thead th.col-bullet { width: 18px; }
.items thead th.col-label { text-align: left; }
.items thead th.col-num { width: 70px; }
.items thead th.col-qty { width: 40px; }

.items tbody td {
  padding: 5px 4px;
  border-bottom: 0.4pt solid #d8d8d8;
  vertical-align: top;
}
.items tbody td.col-bullet { font-size: 9pt; }
.items tbody td.col-label { line-height: 1.35; }
.items tbody td.col-num,
.items tbody td.col-qty { text-align: right; font-variant-numeric: tabular-nums; }
.item-sku { color: #888; font-size: 8pt; margin-top: 1px; }

/* === Footer 2-col (text gauche + totaux droite) === */
.footer {
  margin-top: 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.footer-left { flex: 1.6; }
.footer-right { width: 250px; flex-shrink: 0; }

.policy {
  font-size: 7.5pt;
  color: #666;
  line-height: 1.45;
  margin: 0 0 8px 0;
}

.tax-line {
  font-size: 8pt;
  color: #666;
  margin-top: 8px;
}

.payment-line {
  font-size: 9pt;
  color: #1a1a1a;
  margin-top: 12px;
}
.payment-link { color: #1a1a1a; text-decoration: underline; }
.payment-note {
  font-size: 7.5pt;
  color: #666;
  margin-top: 2px;
}

.totals {
  font-size: 9.5pt;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-variant-numeric: tabular-nums;
}
.total-row.muted { color: #888; }
.total-grand {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 4px 0;
  margin-top: 6px;
  border-top: 1pt solid #1a1a1a;
  font-size: 12pt;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* === Bottom corners === */
.bottom-corners {
  position: absolute;
  bottom: 0.4in;
  left: 0.5in;
  right: 0.5in;
  display: flex;
  justify-content: space-between;
  font-size: 7.5pt;
  color: #999;
}
.thanks { font-style: italic; color: #666; }

/* === Signature line (eval only) === */
.signature {
  margin-top: 16px;
  font-size: 9pt;
}
.signature-line {
  border-bottom: 1pt solid #1a1a1a;
  height: 22px;
  margin-top: 6px;
  width: 280px;
}

.notes-block {
  font-size: 8.5pt;
  color: #444;
  line-height: 1.5;
  margin-top: 8px;
  white-space: pre-wrap;
}
`;

// Helpers de formatage
export function fmt$(n: number): string {
  return `${n.toFixed(2)} $`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
