-- Run this in the Supabase SQL Editor
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
