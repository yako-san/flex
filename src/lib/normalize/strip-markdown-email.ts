// Artefact Sheets : un courriel collé en hyperlien devient `[email](mailto:email)`.
// On extrait l'URL mailto comme valeur canonique. La validation du format
// email proprement dite est faite ailleurs (Zod côté API).

const MARKDOWN_MAILTO = /^\[[^\]]*\]\(mailto:([^)]+)\)$/;

export function stripMarkdownEmail(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  const m = trimmed.match(MARKDOWN_MAILTO);
  if (m && m[1] !== undefined) return m[1].trim();
  return trimmed;
}
