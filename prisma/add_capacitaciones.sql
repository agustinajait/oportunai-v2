-- Run in Supabase SQL editor
CREATE TABLE "Capacitacion" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "video_url" TEXT NOT NULL,
    "rubro" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "pregunta" TEXT NOT NULL,
    "opciones" JSONB NOT NULL,
    "respuesta_correcta" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Capacitacion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CapacitacionUsuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "capacitacion_id" TEXT NOT NULL,
    "completada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapacitacionUsuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CapacitacionUsuario_usuario_id_capacitacion_id_key"
    ON "CapacitacionUsuario"("usuario_id", "capacitacion_id");

ALTER TABLE "Capacitacion" ADD CONSTRAINT "Capacitacion_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitacionUsuario" ADD CONSTRAINT "CapacitacionUsuario_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitacionUsuario" ADD CONSTRAINT "CapacitacionUsuario_capacitacion_id_fkey"
    FOREIGN KEY ("capacitacion_id") REFERENCES "Capacitacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Capacitacion" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CapacitacionUsuario" DISABLE ROW LEVEL SECURITY;
