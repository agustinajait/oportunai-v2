'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, LayoutDashboard, Shield, Zap, Building2 } from 'lucide-react';

interface NavbarProps {
  session: { nombre: string; role: 'super_admin' | 'admin' | 'user' | 'empleador'; slug?: string };
}

export default function Navbar({ session }: NavbarProps) {
  const { nombre, role } = session;
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-ink-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
          <span className="font-display text-lg font-semibold text-ink-800">Oportunai</span>
        </Link>

        <div className="flex items-center gap-2">
          {role === 'super_admin' && (
            <Link href="/super-admin" className="btn-ghost text-sm gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              <Zap size={15} />
              Super Admin
            </Link>
          )}
          {(role === 'admin' || role === 'super_admin') && (
            <Link href="/admin" className="btn-ghost text-sm gap-1.5">
              <Shield size={15} />
              Admin
            </Link>
          )}
          {role === 'empleador' && (
            <Link href="/empresa/dashboard" className="btn-ghost text-sm gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Building2 size={15} />
              Mi empresa
            </Link>
          )}
          {role !== 'empleador' && (
            <Link href="/dashboard" className="btn-ghost text-sm gap-1.5">
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
          )}
          <div className="w-px h-5 bg-ink-200 mx-1" />
          <span className="text-sm text-ink-500 hidden sm:block">{nombre.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-ghost text-sm gap-1.5 text-ink-500">
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
