CREATE TABLE IF NOT EXISTS "GaleriaHome" (
  "id"         TEXT NOT NULL,
  "src"        TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "orden"      INTEGER NOT NULL DEFAULT 0,
  "big"        BOOLEAN NOT NULL DEFAULT false,
  "activa"     BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GaleriaHome_pkey" PRIMARY KEY ("id")
);
