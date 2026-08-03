-- ─── MÓDULOS DE SERVICIO ────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor

CREATE TYPE "FrecuenciaModulo" AS ENUM ('diaria', 'semanal', 'mensual', 'unica');
CREATE TYPE "EstadoServicio" AS ENUM ('activo', 'cerrado');
CREATE TYPE "EstadoPostulacionServicio" AS ENUM ('pendiente', 'aceptado', 'rechazado');
CREATE TYPE "EstadoModulo" AS ENUM ('en_progreso', 'en_riesgo', 'completado', 'aprobado');
CREATE TYPE "EstadoEvidencia" AS ENUM ('pendiente', 'aprobado', 'rechazado');

CREATE TABLE "Servicio" (
  "id"                TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "empresa_id"        TEXT NOT NULL REFERENCES "Empresa"("id") ON DELETE CASCADE,
  "titulo"            TEXT NOT NULL,
  "descripcion"       TEXT NOT NULL,
  "frecuencia"        "FrecuenciaModulo" NOT NULL DEFAULT 'mensual',
  "deadline"          TIMESTAMP(3),
  "capacitacion_id"   TEXT REFERENCES "Capacitacion"("id") ON DELETE SET NULL,
  "contrato_template" TEXT,
  "protocolo"         JSONB NOT NULL DEFAULT '[]',
  "estado"            "EstadoServicio" NOT NULL DEFAULT 'activo',
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "PostulacionServicio" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "servicio_id" TEXT NOT NULL REFERENCES "Servicio"("id") ON DELETE CASCADE,
  "usuario_id"  TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "estado"      "EstadoPostulacionServicio" NOT NULL DEFAULT 'pendiente',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("servicio_id", "usuario_id")
);

CREATE TABLE "ModuloAsignado" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "servicio_id"  TEXT NOT NULL REFERENCES "Servicio"("id") ON DELETE CASCADE,
  "usuario_id"   TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "empresa_id"   TEXT NOT NULL REFERENCES "Empresa"("id") ON DELETE CASCADE,
  "protocolo"    JSONB NOT NULL DEFAULT '[]',
  "estado"       "EstadoModulo" NOT NULL DEFAULT 'en_progreso',
  "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "deadline"     TIMESTAMP(3),
  "contrato_url" TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "EvidenciaItem" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "modulo_id"   TEXT NOT NULL REFERENCES "ModuloAsignado"("id") ON DELETE CASCADE,
  "item_index"  INTEGER NOT NULL,
  "texto"       TEXT,
  "archivo_url" TEXT,
  "estado"      "EstadoEvidencia" NOT NULL DEFAULT 'pendiente',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("modulo_id", "item_index")
);

CREATE TABLE "Remito" (
  "id"            TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "modulo_id"     TEXT NOT NULL UNIQUE REFERENCES "ModuloAsignado"("id") ON DELETE CASCADE,
  "numero_remito" TEXT NOT NULL UNIQUE,
  "pdf_url"       TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
