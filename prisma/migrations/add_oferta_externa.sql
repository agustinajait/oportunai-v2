-- Migración: Tabla OfertaExterna para scraping de portales externos
-- Ejecutar en Supabase SQL Editor o con psql

CREATE TABLE IF NOT EXISTS "OfertaExterna" (
  "id"                TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "fuente"            TEXT        NOT NULL,
  "fuente_id"         TEXT,
  "titulo"            TEXT        NOT NULL,
  "empresa_nombre"    TEXT        NOT NULL,
  "descripcion"       TEXT,
  "area"              TEXT,
  "modalidad"         TEXT        NOT NULL DEFAULT 'presencial',
  "ciudad"            TEXT,
  "salario"           TEXT,
  "url_original"      TEXT        NOT NULL,
  "logo_url"          TEXT,
  "activa"            BOOLEAN     NOT NULL DEFAULT true,
  "fecha_publicacion" TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OfertaExterna_pkey" PRIMARY KEY ("id")
);

-- Índice único para deduplicación
CREATE UNIQUE INDEX IF NOT EXISTS "OfertaExterna_fuente_fuente_id_key"
  ON "OfertaExterna"("fuente", "fuente_id")
  WHERE "fuente_id" IS NOT NULL;

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS "OfertaExterna_fuente_idx"  ON "OfertaExterna"("fuente");
CREATE INDEX IF NOT EXISTS "OfertaExterna_area_idx"    ON "OfertaExterna"("area");
CREATE INDEX IF NOT EXISTS "OfertaExterna_ciudad_idx"  ON "OfertaExterna"("ciudad");
CREATE INDEX IF NOT EXISTS "OfertaExterna_activa_idx"  ON "OfertaExterna"("activa");

-- Trigger para actualizar updated_at automáticamente (opcional)
CREATE OR REPLACE FUNCTION update_oferta_externa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS oferta_externa_updated_at ON "OfertaExterna";
CREATE TRIGGER oferta_externa_updated_at
  BEFORE UPDATE ON "OfertaExterna"
  FOR EACH ROW EXECUTE FUNCTION update_oferta_externa_updated_at();
