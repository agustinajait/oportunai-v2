-- Agrega columna vertical a CapacitateContenido
-- NULL = genérico (visible para todos los candidatos OportunAI)
-- 'mentoress' = exclusivo para candidatos Mentor EESS (estaciones de servicio)
ALTER TABLE "CapacitateContenido"
  ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT NULL;
