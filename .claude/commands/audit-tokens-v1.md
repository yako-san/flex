---
description: Audit invariants Sprint 4 β+ — détecte regressions tokens V1, window.confirm, styles inline
allowed-tools: Grep, Glob, Read, Bash(rg:*)
---

Tu vas auditer le code admin V2 pour les invariants Sprint 4 β+ livrés
le 2026-05-12. Aucune régression n'est tolérée sur ces points.

Scope : $ARGUMENTS (par défaut : `src/app/[locale]/admin` au complet).

## Check-list à exécuter (rapport en tableau)

Pour chaque check, donne le nombre d'occurrences, la liste des fichiers
fautifs (path:line), et le verdict ✅/❌. Termine par un récap exécutif.

### 1. Confirms et alerts natifs

```
rg -n "window\.(confirm|alert)" src/app/\[locale\]/admin
rg -n "\balert\(" src/app/\[locale\]/admin
```

Résultat attendu : **0 occurrence**. Toute occurrence doit passer par
`customConfirm` (modal stylée V1) ou `toast` (sonner).

### 2. Styles inline interdits

```
rg -n "fontSize: '1\.75rem'" src/
rg -n "background: '#1a1a1a'" src/
rg -n "style=\{\{[^}]*background:" src/app/\[locale\]/admin
```

Résultat attendu : **0**. Couleurs et tailles via tokens CSS et classes
Tailwind.

### 3. Tokens V1 manquants

Cherche les couleurs hardcodées qui devraient être des tokens :

```
rg -n "#fff056" src/         # devrait être var(--jaune)
rg -n "#[0-9a-fA-F]{6}" src/app/\[locale\]/admin | grep -v "// "
```

Liste les hex restants et propose le token V1 équivalent (`--jaune`,
`--rouge`, `--st-*`, `--cmd-*`).

### 4. Dropdowns natifs

```
rg -n "<select" src/app/\[locale\]/admin
```

Résultat attendu : **0** (sauf composants techniques justifiés). Les
dropdowns clients/marques doivent être customs (fond noir, texte blanc).

### 5. Bouton « Save » sur formulaires

```
rg -ni "type=\"submit\".*save|>\s*(Save|Sauvegarder|Enregistrer)" src/app/\[locale\]/admin
```

Phase 4.b a éliminé les boutons Save : autosave debounced via
`useDebouncedAutosave`. Toute occurrence est suspecte.

### 6. Heroicons résiduels

V2 utilise Lucide React, pas Heroicons (V1).

```
rg -n "@heroicons" src/
```

Résultat attendu : **0**.

### 7. Textes en anglais user-facing

Cherche les chaînes anglaises évidentes dans les fichiers `.tsx` de la
zone admin. Tu n'es pas obligé d'être exhaustif (ESLint i18n s'en
chargerait), mais flagge les évidences :

```
rg -n ">\s*(Cancel|Save|Delete|Edit|Search|Loading|Submit|Next|Back)\s*<" src/app/\[locale\]/admin
```

## Récap exécutif

Termine ton rapport par :

- Nombre total d'invariants violés.
- Top 3 fichiers les plus problématiques.
- Verdict : ✅ propre, 🟡 dette mineure (< 5 violations), ❌ régression
  (≥ 5 violations sur invariants Sprint 4 β+).
