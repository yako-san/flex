#!/usr/bin/env bash
# Affiche l'état live du projet flex-app V2 — utile pour démarrer une session.
# Usage : ./docs/handoff/memory.sh
#
# Pas de dépendance externe sauf git. Si `gh` est dispo et configuré pour le
# repo yako-san/flex, ajoute le listing des PRs ouvertes ; sinon, juste git.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

cyan() { printf '\033[36m%s\033[0m\n' "$1"; }
dim() { printf '\033[2m%s\033[0m\n' "$1"; }

cyan "═══ flex-app V2 — état session ═══"
echo

cyan "▸ Branche courante"
git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD
echo

cyan "▸ Derniers commits (main)"
git log --oneline -5 origin/main 2>/dev/null || git log --oneline -5
echo

cyan "▸ État working tree"
if git diff-index --quiet HEAD --; then
  echo "  ✓ Propre"
else
  git status --short | head -20
fi
echo

cyan "▸ Branches claude/* locales"
git for-each-ref --format='%(refname:short)' refs/heads/claude/ 2>/dev/null | head -10 || dim "  (aucune)"
echo

cyan "▸ Compteur tests"
if [ -f vitest.config.ts ]; then
  test_count=$(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l)
  echo "  $test_count fichiers .test.{ts,tsx} dans src/"
else
  dim "  (vitest.config.ts absent)"
fi
echo

cyan "▸ PR ouvertes (via gh, si installé)"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh pr list --repo yako-san/flex --state open --limit 10 \
    --json number,title,headRefName,isDraft \
    --jq '.[] | "  #\(.number) [\(.headRefName)] \(.title)\(if .isDraft then " (draft)" else "" end)"' \
    2>/dev/null || dim "  (gh non configuré pour yako-san/flex)"
else
  dim "  (gh CLI absent — voir https://github.com/yako-san/flex/pulls)"
fi
echo

cyan "▸ Migration SQL en attente d'apply (Sprint 2.8)"
if [ -f prisma/migrations/20260512170000_bdc_photo/migration.sql ]; then
  echo "  ⚠ prisma/migrations/20260512170000_bdc_photo/migration.sql"
  echo "    Appliquer sur Neon flex-prod / branche main"
else
  echo "  ✓ Aucune"
fi
echo

cyan "▸ Référence visuelle V1"
if [ -d docs/v1-reference/screenshots ]; then
  count=$(find docs/v1-reference/screenshots -name "*.png" | wc -l)
  echo "  $count captures V1.0.19 dans docs/v1-reference/screenshots/"
else
  dim "  (absent — fetch depuis yako-san/flex-handoff-public)"
fi
echo

cyan "▸ État Sprint 4 β+"
echo "  Voir CLAUDE.md section « État Sprint 4 β+ » ou docs/handoff/primer.md"
echo

dim "Prochain pas si autopilote : docs/handoff/primer.md → section « Si pas de tâche »"
