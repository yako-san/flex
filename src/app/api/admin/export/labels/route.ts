import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
// bwip-js types ne se résolvent pas correctement en moduleResolution=Bundler
// (export `node` non détecté par next-server). Import dynamique + cast.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bwipjs = require('bwip-js') as { toSVG: (opts: Record<string, unknown>) => string };
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Génère une page HTML A4 imprimable avec des étiquettes pièces (SKU,
// nom, prix, code-barre SVG via bwip-js). Format de grille : 5 colonnes
// × 13 lignes = 65 étiquettes par page (compatible Avery 5160 ou
// équivalent).
//
// Filtres URL :
//   ?ids=piece1,piece2,...   — pièces spécifiques par ID (priorité)
//   ?categorie=Transmission  — filtrage par catégorie (insensitive contains)
//   ?fournisseur=Babac       — filtrage fournisseur
//   ?withSku=1               — uniquement pièces avec SKU non-vide
//
// Si aucun filtre, retourne TOUTES les pièces non supprimées.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function barcodeSvg(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  try {
    const svg = bwipjs.toSVG({
      bcid: 'code128', // CODE 128 — supporte alphanumérique + symboles
      text,
      scale: 2,
      height: 8, // mm
      includetext: false, // on affiche le texte SKU séparément
      backgroundcolor: 'FFFFFF',
    });
    return svg;
  } catch {
    return ''; // SKU invalide pour code128 — fallback texte seul
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  const { searchParams } = new URL(req.url);
  const idsRaw = searchParams.get('ids');
  const categorie = searchParams.get('categorie');
  const fournisseur = searchParams.get('fournisseur');
  const withSku = searchParams.get('withSku') === '1';

  type WhereInput = Parameters<typeof prisma.piece.findMany>[0] extends infer P
    ? P extends { where?: infer W } ? W : never : never;
  const where: WhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
  };
  if (idsRaw) {
    const ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      (where as { id?: { in: string[] } }).id = { in: ids };
    }
  }
  if (categorie) {
    (where as { categorie?: { contains: string; mode: 'insensitive' } }).categorie = {
      contains: categorie,
      mode: 'insensitive',
    };
  }
  if (fournisseur) {
    (where as { fournisseur?: { contains: string; mode: 'insensitive' } }).fournisseur = {
      contains: fournisseur,
      mode: 'insensitive',
    };
  }
  if (withSku) {
    (where as { sku?: { not: null } }).sku = { not: null };
  }

  const pieces = await prisma.piece.findMany({
    where,
    orderBy: [{ categorie: 'asc' }, { nomCanonical: 'asc' }],
    select: {
      id: true,
      sku: true,
      nomCanonical: true,
      prixVente: true,
      categorie: true,
    },
  });

  // Génère les SVG en parallèle pour chaque pièce ayant un SKU
  const labels = await Promise.all(
    pieces.map(async (p) => ({
      ...p,
      barcode: p.sku ? await barcodeSvg(p.sku) : '',
    })),
  );

  const html = renderLabelsPage(workshop.name, labels);
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

type Label = {
  id: string;
  sku: string | null;
  nomCanonical: string;
  prixVente: { toString: () => string };
  categorie: string | null;
  barcode: string;
};

function renderLabelsPage(workshopName: string, labels: Label[]): string {
  const cells = labels.map((l) => {
    const nom = escapeHtml(l.nomCanonical);
    const sku = l.sku ? escapeHtml(l.sku) : '—';
    const cat = l.categorie ? escapeHtml(l.categorie) : '';
    const prix = Number(l.prixVente.toString()).toFixed(2);
    return `<div class="label">
      <div class="bc">${l.barcode}</div>
      <div class="sku">${sku}</div>
      <div class="nom" title="${nom}">${nom}</div>
      <div class="bottom">
        <span class="cat">${cat}</span>
        <span class="prix">${prix} $</span>
      </div>
    </div>`;
  }).join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Étiquettes — ${escapeHtml(workshopName)} (${labels.length} pièces)</title>
<style>
  @page { size: letter; margin: 9mm 5mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
  }
  .toolbar {
    position: sticky;
    top: 0;
    background: #1a1a1a;
    color: white;
    padding: 0.6rem 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    z-index: 10;
  }
  .toolbar button {
    padding: 0.4rem 1rem;
    border: 0;
    background: #1565c0;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1mm 1mm;
    padding: 5mm;
    max-width: 215.9mm;
    margin: 0 auto;
    background: white;
  }
  .label {
    border: 0.5px dashed #aaa;
    padding: 1mm 1.5mm;
    height: 19mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .bc {
    height: 8mm;
    margin-bottom: 0.5mm;
    text-align: center;
  }
  .bc svg { max-height: 8mm; max-width: 100%; }
  .sku {
    font-family: monospace;
    font-size: 7pt;
    text-align: center;
    color: #555;
  }
  .nom {
    font-size: 6.5pt;
    line-height: 1.1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    flex: 1;
  }
  .bottom {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 6pt;
    margin-top: 0.5mm;
  }
  .cat { color: #888; overflow: hidden; text-overflow: ellipsis; max-width: 60%; white-space: nowrap; }
  .prix { font-weight: 700; }
  @media print {
    .toolbar { display: none; }
    body { background: white; }
    .grid { padding: 0; }
    .label { border-color: #ddd; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <strong>${labels.length} étiquettes</strong> — ${escapeHtml(workshopName)}
    <button onclick="window.print()">🖨️ Imprimer</button>
    <span style="margin-left:auto;font-size:0.78rem;opacity:0.7;">Format US Letter, 5 colonnes — code-barre Code 128</span>
  </div>
  <div class="grid">
    ${cells}
  </div>
</body>
</html>`;
}
