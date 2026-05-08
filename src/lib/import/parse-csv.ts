// Mini parser CSV — gère guillemets, virgules dans les valeurs, et retours
// chariot dans les valeurs entre guillemets. Suffisant pour les exports
// xlsx → CSV typiques (Excel, Google Sheets, Numbers).

export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsv(content: string): CsvParseResult {
  // Strip BOM UTF-8 si présent
  const text = content.startsWith('﻿') ? content.slice(1) : content;
  const lines = splitCsvRows(text);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0] ?? '');
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim() === '') continue;
    const cells = parseCsvLine(raw);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      // " échappé en "" — laisser tel quel pour parseCsvLine
      if (inQuotes && text[i + 1] === '"') {
        current += '""';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      current += c;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      rows.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  if (current.length > 0) rows.push(current);
  return rows;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

// Devine la colonne CSV qui correspond le mieux à un champ cible
// (matching insensitive sur des alias multiples).
const FIELD_ALIASES: Record<string, string[]> = {
  prenom: ['prenom', 'prénom', 'firstname', 'first_name', 'first name', 'given name'],
  nom: ['nom', 'lastname', 'last_name', 'last name', 'surname', 'family name'],
  courriel: ['courriel', 'email', 'e-mail', 'mail'],
  telephone: ['telephone', 'téléphone', 'phone', 'tel', 'mobile', 'cell'],
  indicatif: ['indicatif', 'country code', 'country_code'],
  notes: ['notes', 'note', 'remarque', 'comment', 'comments'],
  lang: ['lang', 'langue', 'language'],
  commPref: ['commpref', 'comm_pref', 'comm pref', 'communication', 'pref'],
  lead: ['lead', 'source'],
};

export function autoMapColumns(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[_\-\s]+/g, '');
  const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalize(h) }));
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const aliasNorm = normalize(alias);
      const match = normalizedHeaders.find((h) => h.norm === aliasNorm);
      if (match) {
        result[field] = match.original;
        break;
      }
    }
  }
  return result;
}
