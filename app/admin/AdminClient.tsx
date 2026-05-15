'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import {
  Users, Settings, Video, Mic, Edit3, Check, X,
  Loader2, ChevronDown, ChevronUp, Clock, FileText
} from 'lucide-react';
import { SessionPayload } from '@/lib/auth';

interface ConfigItem {
  id: string; tipo_video: string; nombre_modulo: string;
  duracion_base: number; texto_guia: string; orden: number;
}
interface UsuarioRow {
  id: string; nombre_completo: string; email: string; dni: string;
  role: string; slug: string; created_at: string;
  _count: { videos: number; archivos: number };
}

export default function AdminClient({
  usuarios, config, session,
}: {
  usuarios: UsuarioRow[]; config: ConfigItem[]; session: SessionPayload;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'config' | 'users'>('config');
  const [editing, setEditing] = useState<Record<string, { duracion_base: number; texto_guia: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expandedTipo, setExpandedTipo] = useState<string | null>('video_cv');

  const cvConfig = config.filter((c) => c.tipo_video === 'video_cv');
  const pitchConfig = config.filter((c) => c.tipo_video === 'video_pitch');

  const getEditing = (item: ConfigItem) =>
    editing[item.id] ?? { duracion_base: item.duracion_base, texto_guia: item.texto_guia };

  const handleChange = (id: string, field: string, value: string | number) => {
    setEditing((prev) => ({ ...prev, [id]: { ...getEditing({ id } as ConfigItem), [field]: value } }));
  };

  const handleSave = async (item: ConfigItem) => {
    const data = getEditing(item);
    setSaving(item.id);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...data }),
      });
      if (res.ok) {
        setSaved(item.id);
        setTimeout(() => setSaved(null), 2000);
        router.refresh();
      }
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = (id: string) => {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const isDirty = (item: ConfigItem) => {
    const e = editing[item.id];
    if (!e) return false;
    return e.duracion_base !== item.duracion_base || e.texto_guia !== item.texto_guia;
  };

  const renderConfigSection = (label: string, tipo: string, items: ConfigItem[], icon: React.ReactNode) => (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpandedTipo(expandedTipo === tipo ? null : tipo)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
            {icon}
          </div>
          <div className="text-left">
            <p className="font-medium text-ink-800">{label}</p>
            <p className="text-xs text-ink-400">{items.length} módulos</p>
          </div>
        </div>
        {expandedTipo === tipo ? <ChevronUp size={18} className="text-ink-400" /> : <ChevronDown size={18} className="text-ink-400" />}
      </button>

      {expandedTipo === tipo && (
        <div className="border-t border-ink-100 divide-y divide-ink-100">
          {items.map((item) => {
            const e = getEditing(item);
            const dirty = isDirty(item);
            return (
              <div key={item.id} className="px-6 py-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="badge bg-ink-100 text-ink-600 mr-2">#{item.orden}</span>
                    <span className="font-medium text-ink-800 text-sm">{item.nombre_modulo}</span>
                  </div>
                  {saved === item.id && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <Check size={14} /> Guardado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Clock size={13} /> Duración (seg.)
                    </label>
                    <input
                      type="number"
                      min={5} max={120}
                      value={e.duracion_base}
                      onChange={(ev) => handleChange(item.id, 'duracion_base', parseInt(ev.target.value))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Texto guía</label>
                    <textarea
                      value={e.texto_guia}
                      onChange={(ev) => handleChange(item.id, 'texto_guia', ev.target.value)}
                      rows={2}
                      className="input-field text-sm resize-none"
                    />
                  </div>
                </div>

                {dirty && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleSave(item)}
                      disabled={saving === item.id}
                      className="btn-primary py-1.5 px-4 text-sm"
                    >
                      {saving === item.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Guardar
                    </button>
                    <button onClick={() => handleCancel(item.id)} className="btn-ghost py-1.5 px-3 text-sm">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar session={session} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-1">Panel de administración</h1>
          <p className="text-ink-400 text-sm">Configuración global y gestión de usuarios</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ink-100 rounded-xl p-1 mb-8 w-fit">
          {[
            { key: 'config', label: 'Configuración de video', icon: <Settings size={15} /> },
            { key: 'users', label: 'Usuarios', icon: <Users size={15} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white text-ink-800 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Config tab */}
        {tab === 'config' && (
          <div className="space-y-4">
            <p className="text-sm text-ink-400 mb-4">
              Editá la duración y el texto guía de cada módulo. Los cambios afectan a todos los usuarios.
            </p>
            {renderConfigSection('Video CV', 'video_cv', cvConfig, <Video size={18} />)}
            {renderConfigSection('Video Pitch', 'video_pitch', pitchConfig, <Mic size={18} />)}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100">
              <p className="font-medium text-ink-800">{usuarios.length} usuarios registrados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink-50 text-ink-400 font-medium">
                    <th className="text-left px-6 py-3">Nombre</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">DNI</th>
                    <th className="text-left px-6 py-3">Rol</th>
                    <th className="text-left px-6 py-3">Videos</th>
                    <th className="text-left px-6 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-ink-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-ink-800">{u.nombre_completo}</p>
                        <p className="text-xs text-ink-400">/{u.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-ink-600">{u.email}</td>
                      <td className="px-6 py-4 text-ink-600">{u.dni}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-600">{u._count.videos}</td>
                      <td className="px-6 py-4 text-ink-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usuarios.length === 0 && (
                <div className="text-center py-12 text-ink-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No hay usuarios aún</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
