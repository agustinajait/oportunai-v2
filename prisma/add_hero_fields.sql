-- Run this in the Supabase SQL Editor
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "mensaje_bienvenida" TEXT;
ALTER TABLE "Oferta"  ADD COLUMN IF NOT EXISTS "titulo_hero" TEXT;
