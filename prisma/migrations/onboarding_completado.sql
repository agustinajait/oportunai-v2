-- Migration: onboarding_completado
-- Agrega campo para trackear si el usuario completó el wizard de onboarding.
-- Los usuarios existentes se marcan como completados para no interrumpirlos.

ALTER TABLE "Usuario"
  ADD COLUMN IF NOT EXISTS "onboarding_completado" BOOLEAN NOT NULL DEFAULT false;

-- Marcar usuarios existentes como ya onboardeados
UPDATE "Usuario" SET "onboarding_completado" = true;
