'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Shield, Zap, Building2 } from 'lucide-react';

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
          <span className="font-display text-lg font-semibold text-ink-800 hidden xs:block sm:block">Oportunai</span>
        </Link>

        {/* Right side — icon-only on mobile, icon+text on sm+ */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {role === 'super_admin' && (
            <Link
              href="/super-admin"
              title="Super Admin"
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors text-sm font-medium"
            >
              <Zap size={16} />
              <span className="hidden sm:inline">Super Admin</span>
            </Link>
          )}
          {(role === 'admin' || role === 'super_admin') && (
            <Link
              href="/admin"
              title="Admin"
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-ink-600 hover:bg-ink-50 transition-colors text-sm font-medium"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {role === 'empleador' && (
            <Link
              href="/empresa/dashboard"
              title="Mi empresa"
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <Building2 size={16} />
              <span className="hidden sm:inline">Mi empresa</span>
            </Link>
          )}
          {role !== 'empleador' && (
            <Link
              href="/dashboard"
              title="Mi panel"
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-ink-600 hover:bg-ink-50 transition-colors text-sm font-medium"
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          <div className="w-px h-5 bg-ink-200 mx-0.5 sm:mx-1 hidden sm:block" />
          <span className="text-sm text-ink-500 hidden sm:block max-w-[80px] truncate">{nombre.split(' ')[0]}</span>

          <button
            onClick={handleLogout}
            title="Salir"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-ink-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
