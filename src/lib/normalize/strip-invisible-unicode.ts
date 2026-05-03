// Caractères invisibles fréquents dans des champs collés depuis Sheets/iOS :
//   U+200B-U+200D : ZWSP, ZWNJ, ZWJ
//   U+200E-U+200F : LRM, RLM (marqueurs de direction)
//   U+202A-U+202E : LRE, RLE, PDF, LRO, RLO (formatage directionnel bidi)
//   U+2060        : WORD JOINER
//   U+FEFF        : BOM / ZWNBSP
const INVISIBLES = /[​-‏‪-‮⁠﻿]/g;

export function stripInvisibleUnicode(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  return input.replace(INVISIBLES, '');
}
