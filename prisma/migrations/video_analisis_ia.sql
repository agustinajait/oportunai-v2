-- Agrega campo para almacenar el análisis automático de IA del Video CV
ALTER TABLE "Video"
  ADD COLUMN IF NOT EXISTS analisis_ia JSONB DEFAULT NULL;
