/**
 * Détection de contraste WCAG — choisit `#000000` ou `#ffffff` selon
 * la luminance relative du background.
 *
 * Référence : https://www.w3.org/TR/WCAG21/#dfn-relative-luminance.
 * Le seuil 0.5 (mid-luminance) est une approximation binaire suffisante
 * pour les fonds gris/colorés moyens utilisés dans le système de bloc
 * additif. Au-delà → noir lisible ; en dessous → blanc lisible.
 */
export function relLuminance(hex: string): number {
  // Accepte #rgb, #rrggbb, #rrggbbaa. Normalise en {0..1}³.
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length < 6 || !/^[0-9a-fA-F]{6}/.test(h)) return 1; // invalide → texte noir.
  const rgb = [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)]
    .map((s) => parseInt(s, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
}

export function pickTextColor(bgHex: string): '#000000' | '#ffffff' {
  return relLuminance(bgHex) > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convertit une couleur CSS computed (`rgb(126, 126, 126)`) en hex.
 * Utile pour lire la valeur résolue depuis `getComputedStyle`.
 */
export function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb;
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map((s) => Number(s).toString(16).padStart(2, '0'))
      .join('')
  );
}
