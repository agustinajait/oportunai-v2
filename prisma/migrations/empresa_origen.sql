-- Agrega campo origen a Empresa para identificar empresas que entraron por Mentores u otras landings
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "origen" TEXT;
