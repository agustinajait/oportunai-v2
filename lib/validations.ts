import { z } from 'zod';

export const registerSchema = z.object({
  nombre_completo: z.string().min(3, 'Nombre muy corto').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  telefono: z.string().min(8, 'Teléfono inválido').max(20),
  direccion: z.string().min(5, 'Dirección muy corta').max(200),
  dni: z.string().min(7, 'DNI inválido').max(10),
  fecha_nacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export const bioSchema = z.object({
  bio: z.string().max(500, 'Máximo 500 caracteres'),
});

export const configuracionVideoSchema = z.object({
  id: z.string(),
  duracion_base: z.number().int().min(5).max(120),
  texto_guia: z.string().min(10).max(300),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
