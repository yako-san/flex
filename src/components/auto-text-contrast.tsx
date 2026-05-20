'use client';

import * as React from 'react';
import { pickTextColor, rgbToHex } from '@/lib/theme/contrast';

/**
 * Lit `--app-bg` résolu depuis `:root`, calcule la couleur de texte
 * idéale (noir ou blanc selon luminance WCAG), et la met dans la CSS
 * variable `--text-on-bg`.
 *
 * Cette var est branchée sur `body` + `h1..h5` (cf. globals.css). Si
 * l'utilisateur a explicitement override `--h1-color` etc. via le
 * Token editor, son choix gagne — c'est juste un défaut auto-adaptatif.
 *
 * Re-run :
 *   - au mount (initial render)
 *   - quand `body.classList` change (toggle dark/light)
 *   - quand `--app-bg` change (édition live dans le Tokens editor)
 *
 * Sans dépendance externe : MutationObserver natif.
 */
export function AutoTextContrast() {
  React.useEffect(() => {
    const root = document.documentElement;

    function recompute() {
      const computed = getComputedStyle(root);
      const rawBg = (computed.getPropertyValue('--app-bg') || '').trim();
      // `--app-bg` peut être en hex (#7e7e7e) ou en rgb() — on normalise.
      const hex = rawBg.startsWith('#') ? rawBg : rgbToHex(rawBg);
      const fg = pickTextColor(hex);
      root.style.setProperty('--text-on-bg', fg);
    }

    recompute();

    // Observer 1 : changement de class sur <body> (toggle dark/light).
    const bodyObs = new MutationObserver(recompute);
    bodyObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Observer 2 : changement de style inline sur <html> (Tokens editor
    // qui pousse `--app-bg` via documentElement.style.setProperty).
    const rootObs = new MutationObserver(recompute);
    rootObs.observe(root, { attributes: true, attributeFilter: ['style'] });

    return () => {
      bodyObs.disconnect();
      rootObs.disconnect();
    };
  }, []);

  return null;
}
