-- Agrega campos de redes sociales / presencia online al candidato
ALTER TABLE "Usuario"
  ADD COLUMN IF NOT EXISTS "linkedin_url"  TEXT,
  ADD COLUMN IF NOT EXISTS "instagram_url" TEXT,
  ADD COLUMN IF NOT EXISTS "sitio_web"     TEXT;
