-- Migration: korai_acompanamiento_push
-- Adds persistent accompaniment state and web push subscriptions for Korai

-- ── KoraiAcompanamiento ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "KoraiAcompanamiento" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "usuario_id"           TEXT NOT NULL,
  "situacion_actual"     TEXT,
  "prioridades"          JSONB,
  "objetivos"            JSONB,
  "acciones_pendientes"  JSONB,
  "acciones_realizadas"  JSONB,
  "proximo_paso"         TEXT,
  "ultima_interaccion"   TIMESTAMPTZ,
  "proximo_seguimiento"  TIMESTAMPTZ,
  "ultimo_diagnostico"   JSONB,
  "diagnostico_anterior" JSONB,
  "notas_equipo"         TEXT,
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "KoraiAcompanamiento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KoraiAcompanamiento_usuario_id_key" UNIQUE ("usuario_id"),
  CONSTRAINT "KoraiAcompanamiento_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "KoraiAcompanamiento_proximo_seguimiento_idx"
  ON "KoraiAcompanamiento" ("proximo_seguimiento")
  WHERE "proximo_seguimiento" IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_korai_acompanamiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_korai_acompanamiento_updated_at ON "KoraiAcompanamiento";
CREATE TRIGGER trg_korai_acompanamiento_updated_at
  BEFORE UPDATE ON "KoraiAcompanamiento"
  FOR EACH ROW EXECUTE FUNCTION update_korai_acompanamiento_updated_at();

-- ── PushSuscripcion ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PushSuscripcion" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "usuario_id"  TEXT NOT NULL,
  "endpoint"    TEXT NOT NULL,
  "p256dh"      TEXT NOT NULL,
  "auth"        TEXT NOT NULL,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "PushSuscripcion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushSuscripcion_endpoint_key" UNIQUE ("endpoint"),
  CONSTRAINT "PushSuscripcion_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PushSuscripcion_usuario_id_idx"
  ON "PushSuscripcion" ("usuario_id");
