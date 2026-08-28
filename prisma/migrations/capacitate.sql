-- Migration: capacitate
-- Crea el módulo CAPACITATE: motor de capacitaciones laborales gamificadas.
-- El contenido (capacitaciones, módulos) se carga por separado vía seed/admin.
-- Correr en: Supabase Dashboard → SQL Editor (proyecto pqmqxsioxvgrturpgyhi)

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "CapacitateModuloTipo" AS ENUM (
  'lectura',
  'pregunta',
  'situacion',
  'actividad',
  'desafio_final'
);

CREATE TYPE "CapacitateEstado" AS ENUM (
  'no_iniciada',
  'en_progreso',
  'completada',
  'aprobada'
);

-- ── CapacitateContenido ───────────────────────────────────────────────────────
-- Plantilla de una capacitación. Datos, no código.

CREATE TABLE "CapacitateContenido" (
  "id"           TEXT      NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"         TEXT      NOT NULL,
  "titulo"       TEXT      NOT NULL,
  "categoria"    TEXT      NOT NULL,   -- 'fisicos_oficios' | 'digitales'
  "descripcion"  TEXT      NOT NULL,
  "nivel"        TEXT      NOT NULL DEFAULT 'inicial',
  "duracion_min" INTEGER   NOT NULL,
  "objetivo"     TEXT      NOT NULL,
  "competencias" JSONB     NOT NULL DEFAULT '[]',
  "icono"        TEXT,
  "orden"        INTEGER   NOT NULL DEFAULT 0,
  "activa"       BOOLEAN   NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CapacitateContenido_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CapacitateContenido_slug_key" ON "CapacitateContenido"("slug");
CREATE INDEX "CapacitateContenido_categoria_idx" ON "CapacitateContenido"("categoria");
CREATE INDEX "CapacitateContenido_activa_idx" ON "CapacitateContenido"("activa");

-- ── CapacitateModulo ─────────────────────────────────────────────────────────
-- Pasos individuales de una capacitación. Estructura flexible por tipo.

CREATE TABLE "CapacitateModulo" (
  "id"               TEXT      NOT NULL DEFAULT gen_random_uuid()::text,
  "contenido_id"     TEXT      NOT NULL,
  "orden"            INTEGER   NOT NULL,
  "titulo"           TEXT      NOT NULL,
  "tipo"             "CapacitateModuloTipo" NOT NULL,
  "contenido"        JSONB     NOT NULL DEFAULT '{}',
  "es_desafio_final" BOOLEAN   NOT NULL DEFAULT false,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CapacitateModulo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CapacitateModulo_contenido_id_fkey"
    FOREIGN KEY ("contenido_id") REFERENCES "CapacitateContenido"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "CapacitateModulo_contenido_id_orden_key"
  ON "CapacitateModulo"("contenido_id", "orden");

-- ── CapacitateProgreso ────────────────────────────────────────────────────────
-- Estado de un usuario en cada capacitación. Resume desde donde quedó.

CREATE TABLE "CapacitateProgreso" (
  "id"              TEXT      NOT NULL DEFAULT gen_random_uuid()::text,
  "usuario_id"      TEXT      NOT NULL,
  "contenido_id"    TEXT      NOT NULL,
  "estado"          "CapacitateEstado" NOT NULL DEFAULT 'no_iniciada',
  "modulo_actual"   INTEGER   NOT NULL DEFAULT 0,
  "respuestas"      JSONB,
  "puntaje_final"   INTEGER,
  "competencias_ok" JSONB,
  "intentos"        INTEGER   NOT NULL DEFAULT 0,
  "iniciada_en"     TIMESTAMP(3),
  "completada_en"   TIMESTAMP(3),
  "aprobada_en"     TIMESTAMP(3),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CapacitateProgreso_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CapacitateProgreso_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE,
  CONSTRAINT "CapacitateProgreso_contenido_id_fkey"
    FOREIGN KEY ("contenido_id") REFERENCES "CapacitateContenido"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "CapacitateProgreso_usuario_id_contenido_id_key"
  ON "CapacitateProgreso"("usuario_id", "contenido_id");

CREATE INDEX "CapacitateProgreso_usuario_id_idx" ON "CapacitateProgreso"("usuario_id");

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER "CapacitateContenido_updated_at"
  BEFORE UPDATE ON "CapacitateContenido"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "CapacitateProgreso_updated_at"
  BEFORE UPDATE ON "CapacitateProgreso"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
