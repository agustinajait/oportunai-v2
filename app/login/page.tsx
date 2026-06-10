'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, LoginInput } from '@/lib/validations';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'google') {
      setServerError('No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? 'Error al iniciar sesión');
      return;
    }
    const dest = json.role === 'super_admin' ? '/super-admin'
      : json.role === 'admin' ? '/admin'
      : json.role === 'empleador' ? '/empresa/dashboard'
      : '/dashboard';
    router.push(dest);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.svg" alt="Oportunai" className="w-9 h-9" />
            <span className="font-display text-2xl font-semibold text-ink-800">Oportunai</span>
          </Link>
          <h1 className="font-display text-3xl font-light text-ink-900 mb-1">Bienvenido/a</h1>
          <p className="text-ink-400 text-sm">Ingresá a tu cuenta</p>
        </div>

        <div className="card p-8">
          {/* Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full border border-ink-200 rounded-xl py-3 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-xs text-ink-300">o ingresá con email</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="input-field"
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3.5">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-400 text-sm mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
