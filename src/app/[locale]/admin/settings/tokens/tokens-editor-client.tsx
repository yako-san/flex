'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type { WorkshopTheme } from '@/lib/theme/types';
import { saveTokensAction, resetTokensAction } from './actions';

type TokenKey = keyof WorkshopTheme;

type Props = {
  defaults: Record<string, string>;
  initial: WorkshopTheme;
};

const COLOR_KEYS: TokenKey[] = ['jaune', 'brun', 'vert', 'rouge', 'dark'];
const TYPE_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5'] as const;
const GREY_KEYS: TokenKey[] = ['app-bg', 'app-bg-light'];
const BUTTON_KEYS: TokenKey[] = ['btn-radius', 'btn-h-sm', 'btn-h-md', 'btn-h-lg'];
const BUTTON_LABELS: Record<string, string> = {
  'btn-radius': 'Rayon (pill)',
  'btn-h-sm': 'Hauteur S',
  'btn-h-md': 'Hauteur M',
  'btn-h-lg': 'Hauteur L',
};
const CAPS_OPTIONS = [
  { v: 'none', l: 'Aa' },
  { v: 'uppercase', l: 'AA' },
  { v: 'lowercase', l: 'aa' },
  { v: 'capitalize', l: 'Aa.' },
];
const WEIGHT_OPTIONS = ['100','200','300','400','500','600','700','800','900'];

// Liste explicite des clés gérées par l'éditeur — sert pour reset all,
// export JSON, et pour pré-remplir l'état initial.
const ALL_KEYS: TokenKey[] = [
  ...COLOR_KEYS,
  ...GREY_KEYS,
  'overlay-step',
  ...(TYPE_LEVELS.flatMap((h) => [`${h}-size`, `${h}-weight`, `${h}-caps`, `${h}-color`]) as TokenKey[]),
  ...BUTTON_KEYS,
];

// Applique un token en CSS var sur `:root` (live preview, pas de save).
function setCssVar(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(`--${name}`, value);
}

export function TokensEditorClient({ defaults, initial }: Props) {
  // État source de vérité : un dict { key: value } pour TOUS les tokens
  // gérés. Si pas d'override tenant, on fallback sur defaults.
  const [tokens, setTokens] = React.useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const k of ALL_KEYS) {
      out[k as string] = (initial[k] as string | undefined) ?? defaults[k as string] ?? '';
    }
    return out;
  });
  const [pending, startTransition] = React.useTransition();

  // Live preview : tous les tokens sont propagés en CSS vars sur :root
  // à chaque modification. `app-bg` ne sera vu en dark mode que.
  React.useEffect(() => {
    for (const [k, v] of Object.entries(tokens)) {
      if (!v) continue;
      setCssVar(k, v);
    }
  }, [tokens]);

  function update(key: string, value: string) {
    setTokens((t) => ({ ...t, [key]: value }));
  }

  function resetSection(scope: 'colors' | 'type' | 'grey' | 'buttons' | 'all') {
    setTokens((t) => {
      const next = { ...t };
      for (const k of ALL_KEYS) {
        const ks = k as string;
        const inScope =
          scope === 'all' ||
          (scope === 'colors' && (COLOR_KEYS as string[]).includes(ks)) ||
          (scope === 'type' && /^h[1-5]-/.test(ks)) ||
          (scope === 'grey' && ((GREY_KEYS as string[]).includes(ks) || ks === 'overlay-step')) ||
          (scope === 'buttons' && (BUTTON_KEYS as string[]).includes(ks));
        if (inScope) next[ks] = defaults[ks] ?? '';
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const r = await saveTokensAction(tokens);
      if (r.ok) toast.success('Tokens sauvegardés');
      else toast.error(r.error);
    });
  }

  function handleResetAll() {
    if (!confirm('Réinitialiser tous les tokens aux défauts ?')) return;
    startTransition(async () => {
      const r = await resetTokensAction();
      if (r.ok) {
        resetSection('all');
        toast.success('Tokens réinitialisés');
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flex-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exporté');
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      {/* ===== EDITOR PANEL ===== */}
      <aside className="rounded-3xl bg-black/20 p-[18px]">
        <Section title="Couleurs signature" onReset={() => resetSection('colors')}>
          {COLOR_KEYS.map((k) => (
            <ColorRow
              key={k as string}
              label={(k as string).charAt(0).toUpperCase() + (k as string).slice(1)}
              varName={k as string}
              value={tokens[k as string] ?? ''}
              onChange={(v) => update(k as string, v)}
            />
          ))}
        </Section>

        <Section title="Échelle typographique" onReset={() => resetSection('type')}>
          <div
            className="grid items-center pb-1 text-[10px] uppercase text-white/50"
            style={{ gridTemplateColumns: '50px 1fr 1fr 1fr 36px', gap: 8 }}
          >
            <span /><span>Taille</span><span>Graisse</span><span>Casse</span><span>Coul.</span>
          </div>
          {TYPE_LEVELS.map((h) => (
            <TypeRow
              key={h}
              level={h}
              size={tokens[`${h}-size`] ?? ''}
              weight={tokens[`${h}-weight`] ?? ''}
              caps={tokens[`${h}-caps`] ?? ''}
              color={tokens[`${h}-color`] ?? ''}
              onChange={(field, v) => update(`${h}-${field}`, v)}
            />
          ))}
        </Section>

        <Section title="Gris système" onReset={() => resetSection('grey')}>
          <ColorRow
            label="Base dark" varName="app-bg"
            value={tokens['app-bg'] ?? ''}
            onChange={(v) => update('app-bg', v)}
          />
          <ColorRow
            label="Base light" varName="app-bg-light"
            value={tokens['app-bg-light'] ?? ''}
            onChange={(v) => update('app-bg-light', v)}
          />
          <SliderRow
            label="Incrément α"
            value={tokens['overlay-step'] ?? '0.20'}
            min={0.05} max={0.40} step={0.05}
            onChange={(v) => update('overlay-step', v)}
          />
          <p className="mt-1.5 text-[10px] leading-snug text-white/50">
            Light empile du blanc, dark empile du noir. ×4 niveaux + base = 5 paliers.
          </p>
        </Section>

        <Section title="Boutons" onReset={() => resetSection('buttons')}>
          {BUTTON_KEYS.map((k) => (
            <PxRow
              key={k as string}
              label={BUTTON_LABELS[k as string] ?? (k as string)}
              varName={k as string}
              value={tokens[k as string] ?? ''}
              min={k === 'btn-radius' ? 0 : 24}
              max={k === 'btn-radius' ? 40 : 64}
              onChange={(v) => update(k as string, v)}
            />
          ))}
        </Section>

        <footer className="flex flex-wrap items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full px-3 py-2 text-[12px] text-white/70 hover:text-white"
          >
            Exporter JSON
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            disabled={pending}
            className="rounded-full border-2 border-white/50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white disabled:opacity-50"
          >
            Tout réinitialiser
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-full bg-[var(--jaune)] px-5 py-2 text-[12px] font-black uppercase tracking-[0.1em] text-black disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </aside>

      {/* ===== PREVIEW PANE ===== */}
      <section className="flex flex-col gap-5 rounded-3xl bg-black/20 p-[22px]">
        <PreviewPalette tokens={tokens} />
        <PreviewTypeScale tokens={tokens} />
        <PreviewRails tokens={tokens} />
        <PreviewButtons tokens={tokens} />
      </section>
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

function Section({
  title, onReset, children,
}: { title: string; onReset: () => void; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/10 py-[14px] first:pt-0 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          {title}
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md px-2 py-1 text-[10px] lowercase text-white/55 hover:bg-white/10 hover:text-white"
        >
          réinitialiser
        </button>
      </div>
      {children}
    </section>
  );
}

function ColorRow({
  label, varName, value, onChange,
}: { label: string; varName: string; value: string; onChange: (v: string) => void }) {
  return (
    <div
      className="mb-2 grid items-center"
      style={{ gridTemplateColumns: '90px 36px 1fr 100px', gap: 10 }}
    >
      <label className="text-[11px] lowercase font-semibold text-white/70">{label}</label>
      <span
        className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-[10px]"
        style={{ background: value, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' }}
      >
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          aria-label={`${label} (sélecteur)`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => {
          let v = e.currentTarget.value.trim();
          if (!v.startsWith('#')) v = '#' + v;
          onChange(/^#[0-9A-Fa-f]{6}$/.test(v) ? v.toLowerCase() : value);
        }}
        className="w-full rounded-lg border-0 bg-black/25 px-2.5 py-2 font-mono text-[12px] uppercase tabular-nums text-white"
      />
      <span className="text-right font-mono text-[10px] text-white/45">--{varName}</span>
    </div>
  );
}

function TypeRow({
  level, size, weight, caps, color, onChange,
}: {
  level: 'h1'|'h2'|'h3'|'h4'|'h5';
  size: string; weight: string; caps: string; color: string;
  onChange: (field: 'size'|'weight'|'caps'|'color', v: string) => void;
}) {
  // Size est stocké au format `<n>px` — on lit l'entier, on réécrit avec `px`.
  const sizePx = parseInt(size.replace(/[^\d]/g, ''), 10) || 0;
  return (
    <div
      className="my-1.5 grid items-center"
      style={{ gridTemplateColumns: '50px 1fr 1fr 1fr 36px', gap: 8 }}
    >
      <span className="rounded-md bg-[var(--jaune)] py-1 text-center text-[11px] font-black uppercase tracking-[0.06em] text-black">
        {level.toUpperCase()}
      </span>
      <input
        type="number"
        min={8} max={120}
        value={sizePx || ''}
        onChange={(e) => onChange('size', `${e.currentTarget.value}px`)}
        className="w-full rounded-lg border-0 bg-black/25 px-2 py-1.5 font-mono text-[11px] text-white"
      />
      <select
        value={weight}
        onChange={(e) => onChange('weight', e.currentTarget.value)}
        className="w-full rounded-lg border-0 bg-black/25 px-2 py-1.5 font-mono text-[11px] text-white"
      >
        {WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
      </select>
      <select
        value={caps}
        onChange={(e) => onChange('caps', e.currentTarget.value)}
        className="w-full rounded-lg border-0 bg-black/25 px-2 py-1.5 font-mono text-[11px] text-white"
      >
        {CAPS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span
        className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-lg"
        style={{ background: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' }}
      >
        <input
          type="color"
          value={normalizeHex(color)}
          onChange={(e) => onChange('color', e.currentTarget.value)}
          aria-label={`${level} couleur`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange,
}: { label: string; value: string; min: number; max: number; step: number; onChange: (v: string) => void }) {
  const num = parseFloat(value) || 0;
  return (
    <div
      className="mb-2.5 grid items-center"
      style={{ gridTemplateColumns: '100px 1fr 60px', gap: 12 }}
    >
      <label className="text-[11px] lowercase font-semibold text-white/70">{label}</label>
      <input
        type="range"
        min={min} max={max} step={step}
        value={num}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="h-1 w-full appearance-none rounded-full bg-white/20 outline-none accent-[var(--jaune)]"
      />
      <span className="text-right font-mono text-[11px] font-bold text-[var(--jaune)]">
        {Math.round(num * 100)} %
      </span>
    </div>
  );
}

// =============================================================================
// Preview panels
// =============================================================================

function PreviewPalette({ tokens }: { tokens: Record<string, string> }) {
  return (
    <div className="rounded-2xl bg-white/60 p-[18px] text-[var(--dark)]">
      <h3 className="m-0 mb-3 text-[11px] uppercase tracking-[0.08em] text-black/55">
        Aperçu · palette
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {COLOR_KEYS.map((k) => {
          const ks = k as string;
          const val = tokens[ks];
          const isJaune = ks === 'jaune' || ks === 'vert';
          return (
            <div
              key={ks}
              className="flex aspect-[1.6/1] items-end justify-start rounded-[10px] p-2 font-mono text-[9px] font-bold"
              style={{
                background: val,
                color: isJaune ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
              }}
            >
              {ks.toUpperCase()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewTypeScale({ tokens }: { tokens: Record<string, string> }) {
  const samples: Record<string, string> = {
    h1: 'Inventaire', h2: 'Bon de travail', h3: '1. Direction',
    h4: 'Inventaire', h5: 'bons de travail',
  };
  return (
    <div className="rounded-2xl bg-white/60 p-[18px] text-[var(--dark)]">
      <h3 className="m-0 mb-3 text-[11px] uppercase tracking-[0.08em] text-black/55">
        Aperçu · échelle typographique
      </h3>
      <div>
        {TYPE_LEVELS.map((h) => (
          <div key={h} className="flex items-baseline gap-3.5 py-1.5">
            <span className="shrink-0 rounded bg-[var(--jaune)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-black">
              {h.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: tokens[`${h}-size`],
                fontWeight: tokens[`${h}-weight`] as React.CSSProperties['fontWeight'],
                textTransform: tokens[`${h}-caps`] as React.CSSProperties['textTransform'],
                color: tokens[`${h}-color`],
                background: h === 'h1' ? '#929292' : undefined,
                padding: h === 'h1' ? '4px 10px' : undefined,
                borderRadius: h === 'h1' ? 4 : undefined,
                lineHeight: 1,
                letterSpacing: h === 'h4' ? '0.1em' : undefined,
              }}
            >
              {samples[h]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewRails({ tokens }: { tokens: Record<string, string> }) {
  const step = parseFloat(tokens['overlay-step'] ?? '0.20') || 0.20;
  return (
    <div className="rounded-2xl bg-white/60 p-[18px] text-[var(--dark)]">
      <h3 className="m-0 mb-3 text-[11px] uppercase tracking-[0.08em] text-black/55">
        Aperçu · gris système
      </h3>
      {(['light', 'dark'] as const).map((mode) => {
        const base = (mode === 'light' ? tokens['app-bg-light'] : tokens['app-bg']) ?? '';
        const overlay = mode === 'light' ? '255,255,255' : '0,0,0';
        const labelColor = mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)';
        const cells = [0, 1, 2, 3, 4];
        return (
          <div
            key={mode}
            className="mb-2 grid overflow-hidden rounded-[10px]"
            style={{ gridTemplateColumns: '90px repeat(5, 1fr)', background: base }}
          >
            <span
              className="flex flex-col items-center justify-center gap-0.5 p-2 font-mono text-[10px] lowercase"
              style={{ color: labelColor }}
            >
              <span>{mode}</span>
              <span className="text-[10px] uppercase tracking-tight">
                {base.toUpperCase()}
              </span>
            </span>
            {cells.map((i) => (
              <span
                key={i}
                className="flex h-10 items-center justify-center font-mono text-[10px] font-bold"
                style={{
                  background: i === 0 ? 'transparent' : `rgba(${overlay},${(step * i).toFixed(2)})`,
                  color: labelColor,
                }}
              >
                {i === 0 ? 'base' : `${Math.round(step * i * 100)}%`}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PreviewButtons({ tokens }: { tokens: Record<string, string> }) {
  const radius = tokens['btn-radius'] || '30px';
  const jaune = tokens['jaune'] || '#fff056';
  const dark = tokens['dark'] || '#1a1a1a';
  const sizes: Array<{ key: string; label: string }> = [
    { key: 'btn-h-sm', label: 'Small' },
    { key: 'btn-h-md', label: 'Medium' },
    { key: 'btn-h-lg', label: 'Large' },
  ];
  return (
    <div className="rounded-2xl bg-white/60 p-[18px] text-[var(--dark)]">
      <h3 className="m-0 mb-3 text-[11px] uppercase tracking-[0.08em] text-black/55">
        Aperçu · boutons
      </h3>
      <div className="flex flex-col gap-3">
        {sizes.map((s) => {
          const h = tokens[s.key] || '38px';
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-mono text-[10px] lowercase text-black/55">
                {s.label}
              </span>
              <button
                type="button"
                style={{
                  height: h, borderRadius: radius, background: jaune, color: '#000',
                  padding: '0 18px', fontSize: 13, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.1em', border: 0,
                }}
              >
                Primary
              </button>
              <button
                type="button"
                style={{
                  height: h, borderRadius: radius, background: 'transparent', color: dark,
                  padding: '0 18px', fontSize: 13, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  border: `2px solid ${dark}80`,
                }}
              >
                Secondary
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PxRow({
  label, varName, value, min, max, onChange,
}: { label: string; varName: string; value: string; min: number; max: number; onChange: (v: string) => void }) {
  const num = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
  return (
    <div
      className="mb-2 grid items-center"
      style={{ gridTemplateColumns: '100px 1fr 60px 90px', gap: 10 }}
    >
      <label className="text-[11px] lowercase font-semibold text-white/70">{label}</label>
      <input
        type="range"
        min={min} max={max} step={1}
        value={num}
        onChange={(e) => onChange(`${e.currentTarget.value}px`)}
        className="h-1 w-full appearance-none rounded-full bg-white/20 outline-none accent-[var(--jaune)]"
      />
      <span className="text-right font-mono text-[11px] font-bold text-[var(--jaune)]">
        {num}px
      </span>
      <span className="text-right font-mono text-[10px] text-white/45">--{varName}</span>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function normalizeHex(v: string): string {
  // <input type="color"> exige #rrggbb strict. Si la valeur ne match pas,
  // on retombe sur du noir pour éviter un warning React.
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  return '#000000';
}
