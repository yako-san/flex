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
  'app-bg'?: string;       // Gris système, fond global AppShell (dark)
  'app-bg-light'?: string; // Pendant light (override de body.light-mode)

  // Typographie — taille (rem/px), couleur (hex/rgba), graisse (100..900),
  // casse (none/uppercase/lowercase/capitalize) par niveau.
  'h1-size'?: string; 'h1-color'?: string; 'h1-weight'?: string; 'h1-caps'?: string;
  'h2-size'?: string; 'h2-color'?: string; 'h2-weight'?: string; 'h2-caps'?: string;
  'h3-size'?: string; 'h3-color'?: string; 'h3-weight'?: string; 'h3-caps'?: string;
  'h4-size'?: string; 'h4-color'?: string; 'h4-weight'?: string; 'h4-caps'?: string;
  'h5-size'?: string; 'h5-color'?: string; 'h5-weight'?: string; 'h5-caps'?: string;

  // Couleurs signature additionnelles + incrément alpha gris additif.
  brun?: string;
  vert?: string;
  dark?: string;
  'overlay-step'?: string;

  // Boutons — radius pill + hauteurs des 3 variantes + typo dans le pill.
  'btn-radius'?: string;
  'btn-h-sm'?: string;
  'btn-h-md'?: string;
  'btn-h-lg'?: string;
  'btn-font-size'?: string;
  'btn-line-height'?: string;

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
// Tailles CSS : px / rem / em uniquement, max 4 chiffres + 2 décimales.
const SIZE_RE = /^\d{1,4}(\.\d{1,2})?(px|rem|em)$/;
// font-weight : valeurs numériques 100..900 par pas de 100 uniquement.
const WEIGHT_RE = /^(100|200|300|400|500|600|700|800|900)$/;
// text-transform : 4 keywords CSS supportés.
const CAPS_VALUES = new Set(['none', 'uppercase', 'lowercase', 'capitalize']);
// Incrément alpha : 0.00..1.00 (2 décimales).
const STEP_RE = /^0?\.\d{1,2}$|^1(\.0{1,2})?$|^0$/;

export function isValidColorValue(v: unknown): v is string {
  return typeof v === 'string' && (HEX_RE.test(v) || RGBA_RE.test(v));
}

export function isValidSizeValue(v: unknown): v is string {
  return typeof v === 'string' && SIZE_RE.test(v);
}

export function isValidWeightValue(v: unknown): v is string {
  return typeof v === 'string' && WEIGHT_RE.test(v);
}

export function isValidCapsValue(v: unknown): v is string {
  return typeof v === 'string' && CAPS_VALUES.has(v);
}

export function isValidStepValue(v: unknown): v is string {
  return typeof v === 'string' && STEP_RE.test(v);
}

// Clés qui acceptent une taille / un poids / une casse / un step au lieu d'une couleur.
const SIZE_KEYS   = new Set([
  'h1-size', 'h2-size', 'h3-size', 'h4-size', 'h5-size',
  'btn-radius', 'btn-h-sm', 'btn-h-md', 'btn-h-lg', 'btn-font-size',
]);
// Multiplicateurs unitless (line-height) : 1, 1.2, 1.5, etc.
const LINE_HEIGHT_KEYS = new Set(['btn-line-height']);
const LINE_HEIGHT_RE = /^\d(\.\d{1,2})?$/;
const WEIGHT_KEYS = new Set(['h1-weight', 'h2-weight', 'h3-weight', 'h4-weight', 'h5-weight']);
const CAPS_KEYS   = new Set(['h1-caps', 'h2-caps', 'h3-caps', 'h4-caps', 'h5-caps']);
const STEP_KEYS   = new Set(['overlay-step']);

export function sanitizeTheme(raw: unknown): WorkshopTheme {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string') continue;
    if (!/^[a-z0-9-]+$/.test(k)) continue;
    const ok =
      WEIGHT_KEYS.has(k) ? isValidWeightValue(v)
      : CAPS_KEYS.has(k) ? isValidCapsValue(v)
      : SIZE_KEYS.has(k) ? isValidSizeValue(v)
      : STEP_KEYS.has(k) ? isValidStepValue(v)
      : LINE_HEIGHT_KEYS.has(k) ? (typeof v === 'string' && LINE_HEIGHT_RE.test(v))
      : isValidColorValue(v);
    if (!ok) continue;
    out[k] = v as string;
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
