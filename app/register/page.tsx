'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchema, RegisterInput } from '@/lib/validations';

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error ?? 'Error al registrarse'); return; }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-ink-800">Oportunai</span>
          </Link>
          <h1 className="font-display text-3xl font-light text-ink-900 mb-1">Creá tu perfil</h1>
          <p className="text-ink-400 text-sm">Es gratis y toma menos de 2 minutos</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input {...register('nombre_completo')} className="input-field" placeholder="María González" />
              {errors.nombre_completo && <p className="error-text">{errors.nombre_completo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">DNI</label>
                <input {...register('dni')} className="input-field" placeholder="12345678" />
                {errors.dni && <p className="error-text">{errors.dni.message}</p>}
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input {...register('fecha_nacimiento')} type="date" className="input-field" />
                {errors.fecha_nacimiento && <p className="error-text">{errors.fecha_nacimiento.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Teléfono</label>
                <input {...register('telefono')} className="input-field" placeholder="1112345678" />
                {errors.telefono && <p className="error-text">{errors.telefono.message}</p>}
              </div>
              <div>
                <label className="label">Dirección</label>
                <input {...register('direccion')} className="input-field" placeholder="Av. Corrientes 1234, CABA" />
                {errors.direccion && <p className="error-text">{errors.direccion.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="tu@email.com" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            {serverError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{serverError}</div>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3.5 mt-2">
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-400 text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Ingresá</Link>
        </p>
      </div>
    </div>
  );
}
