import { sanitizeTheme, themeToCssVars, type WorkshopTheme } from '@/lib/theme/types';

type Props = {
  /**
   * JSON brut de `Workshop.theme` (ou `null` si l'atelier n'a pas
   * personnalisé sa palette — on retombe alors sur les défauts globals.css).
   */
  theme?: unknown;
  /**
   * Optionnel : scope les overrides à un sélecteur (ex: par workshopId).
   * Permet l'aperçu en parallèle d'autres tenants. Défaut = `:root`.
   */
  scope?: string;
};

/**
 * Server Component qui injecte les overrides de tokens d'un atelier
 * en `<style>` au plus haut niveau du layout. Aucun JS client.
 *
 * Sécurité :
 * - `sanitizeTheme` rejette toute clé/valeur non conforme.
 * - Les noms de clés sont restreints à `[a-z0-9-]` et préfixés `--`.
 * - Les valeurs ne peuvent être que des couleurs hex ou rgba(...).
 *   Aucune injection CSS possible (pas de `;`, `{`, `}` accepté).
 */
export function TenantThemeStyle({ theme, scope = ':root' }: Props) {
  const sanitized: WorkshopTheme = sanitizeTheme(theme);
  // Sépare le pendant light : `app-bg-light` cible `body.light-mode`
  // (override de `--app-bg` quand le toggle est ON).
  const { 'app-bg-light': appBgLight, ...rest } = sanitized;
  const rootCss = themeToCssVars(rest);
  const lightCss = appBgLight ? `--app-bg: ${appBgLight};` : '';
  if (!rootCss && !lightCss) return null;
  return (
    <>
      {rootCss ? <style>{`${scope} { ${rootCss} }`}</style> : null}
      {lightCss ? <style>{`body.light-mode { ${lightCss} }`}</style> : null}
    </>
  );
}
