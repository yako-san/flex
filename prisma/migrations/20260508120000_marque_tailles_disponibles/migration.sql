-- Marque.taillesDisponibles : array JSON des tailles cadre disponibles pour
-- cette marque (ex ["XS","S","M","L","XL"] ou ["48","51","54","57"]).
-- Utilisé pour pré-remplir le dropdown taille dans le formulaire vélo.

ALTER TABLE "marque" ADD COLUMN IF NOT EXISTS "tailles_disponibles" JSONB;
