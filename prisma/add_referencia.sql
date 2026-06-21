-- Run this in your Supabase SQL editor or via psql
CREATE TABLE "Referencia" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "empresa_nombre" TEXT NOT NULL,
    "referidor_nombre" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_validada" TIMESTAMP(3),
    "mensaje" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referencia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referencia_token_key" ON "Referencia"("token");

ALTER TABLE "Referencia" ADD CONSTRAINT "Referencia_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
