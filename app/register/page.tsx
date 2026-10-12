'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchema, RegisterInput } from '@/lib/validations';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    const origen = searchParams.get('origen') ?? undefined;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ...(origen ? { origen } : {}) }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error ?? 'Error al registrarse'); return; }
    // El servidor indica si hay que ir al onboarding; sino al redirect param o dashboard
    const dest = json.redirect ?? (searchParams.get('redirect')?.startsWith('/') ? searchParams.get('redirect') : '/dashboard');
    router.push(dest as string);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Hero oscuro */}
      <div
        className="relative px-6 pt-12 pb-8 flex flex-col items-center"
        style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #4B33CC 0%, transparent 60%)' }} />
        <Link href="/" className="relative z-10 flex items-center gap-2.5 mb-5">
          <img src="/logo.png" alt="Oportunai" className="w-9 h-9" />
          <span className="text-white font-bold text-xl tracking-tight">Oportunai</span>
        </Link>
        <div className="relative z-10 text-center">
          <h1 className="text-white font-bold text-3xl leading-tight mb-1.5">Creá tu perfil</h1>
          <p className="text-white/55 text-sm">Es gratis y toma menos de 2 minutos</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-4 pt-6 pb-10 max-w-lg mx-auto w-full">
        <div className="rounded-2xl p-6 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Nombre completo</label>
              <input
                {...register('nombre_completo')}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                placeholder="María González"
              />
              {errors.nombre_completo && <p className="text-red-500 text-xs mt-1">{errors.nombre_completo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>DNI</label>
                <input
                  {...register('dni')}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                  placeholder="12345678"
                />
                {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Nacimiento</label>
                <input
                  {...register('fecha_nacimiento')}
                  type="date"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                />
                {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Teléfono</label>
                <input
                  {...register('telefono')}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                  placeholder="1112345678"
                />
                {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Dirección</label>
                <input
                  {...register('direccion')}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                  placeholder="Quilmes, Buenos Aires"
                />
                {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.25)' }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.35)' }}
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta gratis'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#7048F0' }}>Ingresá</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
