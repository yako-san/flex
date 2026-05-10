-- Sprint 2.7+ — numéro séquentiel propre par BDT (Bdc.numero)
--
-- V1 utilise Velo.veloNumero comme identifiant lisible mais ça pose
-- problème quand un même vélo passe en atelier plusieurs fois (ex 2024
-- puis 2026) : 2 BDT distincts partagent le même numéro. Solution :
-- numéro propre par BDT, séquentiel atelier-scope.
--
-- Backfill : pour les BDT existants importés depuis V1, attribuer
-- un numéro selon (created_at ASC, velo_numero ASC) pour préserver
-- l'ordre chronologique. Counter BDT_SEQUENCE initialisé à
-- max(numero) après backfill.

-- 1. Ajout enum value BDT_SEQUENCE
ALTER TYPE counter_kind ADD VALUE IF NOT EXISTS 'BDT_SEQUENCE';

-- 2. Colonne numero (NULL temporaire pour backfill, NOT NULL après)
ALTER TABLE bdc ADD COLUMN IF NOT EXISTS numero INTEGER;

-- 3. Backfill : ROW_NUMBER() par workshop, ordre chronologique
WITH ranked AS (
  SELECT
    b.id,
    ROW_NUMBER() OVER (
      PARTITION BY b.workshop_id
      ORDER BY b.created_at ASC, b.id ASC
    ) AS rn
  FROM bdc b
  WHERE b.numero IS NULL
)
UPDATE bdc SET numero = ranked.rn
FROM ranked WHERE bdc.id = ranked.id;

-- 4. NOT NULL constraint
ALTER TABLE bdc ALTER COLUMN numero SET NOT NULL;

-- 5. Unique [workshop_id, numero]
CREATE UNIQUE INDEX IF NOT EXISTS bdc_workshop_id_numero_key
  ON bdc (workshop_id, numero);

-- 6. Initialiser le counter BDT_SEQUENCE pour chaque workshop
--    avec max(numero) actuel. Les nouveaux BDT continueront à partir de là.
INSERT INTO counter (id, workshop_id, kind, prefix, current, created_at, updated_at)
SELECT
  'ctr_' || gen_random_uuid()::text,
  b.workshop_id,
  'BDT_SEQUENCE',
  NULL,
  COALESCE(MAX(b.numero), 0),
  NOW(),
  NOW()
FROM bdc b
GROUP BY b.workshop_id
ON CONFLICT DO NOTHING; -- si déjà existant, on garde
