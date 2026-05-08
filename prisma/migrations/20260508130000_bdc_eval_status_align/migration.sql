-- Sprint 1.1 : alignement BdcEvalStatus avec V1
--
-- V1 utilise : '' (vide = indécis) | APPROUVE | REDUX | ATTENTE | REFUSE
-- V2 utilisait : EN_ATTENTE | APPROUVE | REDUX | REFUSE
--
-- Drift corrigé : (a) renommer EN_ATTENTE → ATTENTE pour conformité avec
-- V1, (b) ajouter INDECIS pour représenter la valeur vide v1 (= "pas
-- encore décidé"). Très fréquent en V1 — tout BDT fraîchement créé.

-- 1. Renommer EN_ATTENTE → ATTENTE
ALTER TYPE "bdc_eval_status" RENAME VALUE 'EN_ATTENTE' TO 'ATTENTE';

-- 2. Ajouter INDECIS comme première valeur de l'enum
ALTER TYPE "bdc_eval_status" ADD VALUE IF NOT EXISTS 'INDECIS' BEFORE 'ATTENTE';

-- 3. Changer le défaut de la colonne pour INDECIS
ALTER TABLE "bdc" ALTER COLUMN "eval_status" SET DEFAULT 'INDECIS';
