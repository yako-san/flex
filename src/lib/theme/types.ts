/**
 * Theme par tenant : structure JSON stockée dans `Workshop.theme`
 * (ajout Sprint 4.5). Toutes les clés sont optionnelles — un theme
 * vide retombe sur les défauts définis dans `globals.css`.
 *
 * Convention : chaque clé correspond exactement à une CSS variable
 * sans le préfixe `--`. L'injection runtime se fait via
 * `<TenantThemeStyle workshop={...} />`.
 */
export type WorkshopTheme = {
  // Palette signature
  jaune?: string;
  'jaune-h'?: string;
  rouge?: string;
  'rouge-h'?: string;
  'gris-bg'?: string;

  // Statuts vélo (bg + fg)
  'st-rv-bg'?: string;        'st-rv-fg'?: string;
  'st-recu-bg'?: string;      'st-recu-fg'?: string;
  'st-eval-bg'?: string;      'st-eval-fg'?: string;
  'st-attente-bg'?: string;   'st-attente-fg'?: string;
  'st-approuve-bg'?: string;  'st-approuve-fg'?: string;
  'st-on-bench-bg'?: string;  'st-on-bench-fg'?: string;
  'st-ctrl-qlte-bg'?: string; 'st-ctrl-qlte-fg'?: string;
  'st-fini-bg'?: string;      'st-fini-fg'?: string;
  'st-facturer-bg'?: string;  'st-facturer-fg'?: string;
  'st-facture-bg'?: string;   'st-facture-fg'?: string;
  'st-livre-bg'?: string;     'st-livre-fg'?: string;

  // Statuts pièces (cmd)
  'cmd-listee-bg'?: string;    'cmd-listee-fg'?: string;
  'cmd-estimee-bg'?: string;   'cmd-estimee-fg'?: string;
  'cmd-a-cmder-bg'?: string;   'cmd-a-cmder-fg'?: string;
  'cmd-en-cmde-bg'?: string;   'cmd-en-cmde-fg'?: string;
  'cmd-recu-part-bg'?: string; 'cmd-recu-part-fg'?: string;
  'cmd-recue-bg'?: string;     'cmd-recue-fg'?: string;

  // Étapes mécaniciens
  'etape-eval-bg'?: string;  'etape-eval-fg'?: string;
  'etape-meca-bg'?: string;  'etape-meca-fg'?: string;
  'etape-ctrl-bg'?: string;  'etape-ctrl-fg'?: string;
};

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const RGBA_RE = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/;

export function isValidColorValue(v: unknown): v is string {
  return typeof v === 'string' && (HEX_RE.test(v) || RGBA_RE.test(v));
}

export function sanitizeTheme(raw: unknown): WorkshopTheme {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string') continue;
    if (!/^[a-z0-9-]+$/.test(k)) continue;
    if (!isValidColorValue(v)) continue;
    out[k] = v;
  }
  return out as WorkshopTheme;
}

export function themeToCssVars(theme: WorkshopTheme): string {
  const vars = Object.entries(theme)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(' ');
  return vars;
}
