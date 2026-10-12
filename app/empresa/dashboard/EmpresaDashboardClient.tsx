'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FONT_OPTIONS, type FontKey } from '@/lib/fonts';
import { Check, X, Eye, Phone, Users, Trophy, Archive, Clock, Filter, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Globe, Copy, ExternalLink, LogOut, CalendarPlus, Loader2, GraduationCap, Star, Layers, PlayCircle, CheckCircle2, XCircle, ChevronDown, FileText } from 'lucide-react';

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]{11})/);
  return m ? m[1] : null;
}

const DOCS_CONFIG = [
  { tipo: 'dni', label: 'DNI' },
  { tipo: 'antecedentes_penales', label: 'Antecedentes Penales' },
  { tipo: 'manipulacion_alimentos', label: 'Manip. Alimentos' },
  { tipo: 'libreta_sanitaria', label: 'Libreta Sanitaria' },
  { tipo: 'registro_conducir', label: 'Registro de Conducir' },
  { tipo: 'otro', label: 'Otro documento' },
];

function parseDocLabel(d: string): string {
  if (d.startsWith('otro:')) return d.slice(5) || 'Otro documento';
  return DOCS_CONFIG.find(c => c.tipo === d)?.label || d;
}

function parseDocTipo(d: string): string {
  return d.startsWith('otro:') ? 'otro' : d;
}

const PIPELINE = [
  { estado: 'pendiente', label: 'Sin ver', chipStyle: { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }, icon: Clock },
  { estado: 'visto', label: 'Visto', chipStyle: { background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }, icon: Eye },
  { estado: 'interesado', label: 'Interesado', chipStyle: { background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }, icon: Check },
  { estado: 'contactar', label: 'Contactar', chipStyle: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }, icon: Phone },
  { estado: 'en_proceso', label: 'En proceso', chipStyle: { background: 'rgba(251,146,60,0.15)', color: '#fb923c' }, icon: Users },
  { estado: 'contratado', label: 'Contratado', chipStyle: { background: 'rgba(52,211,153,0.15)', color: '#34d399' }, icon: Trophy },
  { estado: 'bolsa_talentos', label: 'Bolsa talentos', chipStyle: { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }, icon: Archive },
  { estado: 'descartado', label: 'Descartado', chipStyle: { background: 'rgba(248,113,113,0.15)', color: '#f87171' }, icon: X },
];

function calcularEdad(fecha_nacimiento: string | null): string {
  if (!fecha_nacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function calcularEdadNumero(fecha_nacimiento: string | null): number | null {
  if (!fecha_nacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function extraerCiudad(direccion: string | null): string {
  if (!direccion) return '';
  return direccion.split(',').slice(-2).join(',').trim();
}

type Oferta = {
  id: string; titulo: string; descripcion: string; requisitos: string | null;
  area: string | null; ciudad: string | null;
  modalidad: string; estado: string; mensaje_whatsapp: string | null;
  nombre_marca: string | null; logo_url: string | null;
  docs_requeridos: string[]; preguntas_videocv: string[]; created_at: string;
  _count: { postulaciones: number };
};

type CvDatos = {
  resumen?: string;
  experiencia?: { empresa: string; cargo: string; periodo: string; descripcion: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
  habilidades?: string[];
  idiomas?: string[];
};

type Referencia = {
  id: string; empresa_nombre: string; referidor_nombre: string;
  referidor_cargo: string | null; mensaje: string | null;
};

type CapacitacionOk = {
  completada_en: string;
  capacitacion: { id: string; titulo: string; empresa: { nombre: string } };
};

type Postulante = {
  id: string; estado: string; nota: string | null; created_at: string;
  usuario: {
    id: string; nombre_completo: string; email: string; telefono: string;
    slug: string; bio: string | null; direccion: string | null; fecha_nacimiento: string | null;
    cv_datos: CvDatos | null;
    alfa_digital: string | null; alfa_score: number | null;
    videos: { id: string; video_url: string; tipo: string; created_at: string }[];
    referencias?: Referencia[];
    capacitaciones_ok?: CapacitacionOk[];
  };
  video: { id: string; video_url: string; tipo: string; section_attempts?: { nombre: string; intentos: number }[] | null };
  documentos?: { tipo: string; file_url: string }[];
};

type Empresa = {
  id: string; nombre: string; slug: string; logo_url: string | null;
  descripcion: string | null; rubro: string | null; ciudad: string | null; sitio_web: string | null;
  imagenes: string[]; color_primario: string | null; fuente: string | null;
};

type CitaEmpresa = {
  id: string; fecha: string; modalidad: string; lugar: string; mensaje: string | null; grupal: boolean;
  oferta: { titulo: string } | null;
  invitados: {
    id: string; estado: string;
    postulacion: { usuario: { nombre_completo: string; telefono: string } };
  }[];
};

type Cap = {
  id: string; titulo: string; descripcion: string | null; video_url: string;
  rubro: string | null; pregunta: string; opciones: string[]; respuesta_correcta: number;
  activa: boolean; created_at: string;
  _count: { completadas: number };
};

function CONTRATO_PLANTILLA(nombreServicio: string): string {
  return `ACUERDO DE PRESTACIÓN DE SERVICIOS

Entre [NOMBRE DE LA EMPRESA], CUIT [CUIT], con domicilio en [DOMICILIO] (en adelante "la Empresa"), y [NOMBRE DEL PRESTADOR], DNI [DNI], con domicilio en [DOMICILIO] (en adelante "el Prestador"), se acuerda lo siguiente:

1. OBJETO
El Prestador se compromete a realizar el servicio de ${nombreServicio} conforme al protocolo de trabajo acordado, cumpliendo cada uno de los ítems establecidos y aportando la evidencia correspondiente a través de la plataforma Oportunai.

2. DURACIÓN Y FRECUENCIA
El presente acuerdo tiene vigencia desde la fecha de aceptación en la plataforma. La frecuencia de prestación y la carga horaria asignada quedan registradas en el módulo correspondiente.

3. OBLIGACIONES DEL PRESTADOR
- Realizar el servicio en las condiciones, plazos y calidad pactados.
- Cargar evidencia fotográfica o descriptiva por cada ítem del protocolo.
- Informar con anticipación cualquier inconveniente que impida la prestación.

4. OBLIGACIONES DE LA EMPRESA
- Brindar la información y accesos necesarios para la ejecución del servicio.
- Revisar y aprobar las evidencias presentadas en un plazo máximo de [X] días hábiles.
- Emitir el remito correspondiente una vez aprobado el módulo completo.

5. RETRIBUCIÓN
La retribución acordada es de $[MONTO] por [módulo / hora / jornada], a abonarse mediante [MEDIO DE PAGO] dentro de los [X] días de emitido el remito.

6. CONFIDENCIALIDAD
El Prestador se compromete a mantener reserva sobre toda información de la Empresa a la que acceda en el ejercicio de sus funciones.

7. RESCISIÓN
Cualquiera de las partes podrá rescindir el presente con un preaviso de [X] días corridos. El incumplimiento grave de las obligaciones habilitará la rescisión inmediata.

8. JURISDICCIÓN
Para cualquier controversia las partes se someten a la jurisdicción de los tribunales ordinarios de [CIUDAD].

Fecha: [FECHA]

Firma Empresa: ___________________________    Firma Prestador: ___________________________`;
}

function ModuloEmpresaCard({
  modulo, onGenerarRemito, onCambiarEstado, onAprobarItem, generandoRemito, remitoMsg,
}: {
  modulo: {
    id: string; estado: string; deadline: string | null;
    horas_asignadas: number | null; precio_hora: number | null;
    protocolo: { item: string; descripcion: string }[];
    usuario: { id: string; nombre_completo: string; email: string; telefono: string; slug: string; foto_url: string | null };
    evidencias: { item_index: number; texto: string | null; archivo_url: string | null; estado: string }[];
    remito: { id: string; numero_remito: string; pdf_url: string | null } | null;
  };
  onGenerarRemito: (id: string) => void;
  onCambiarEstado: (id: string, estado: string) => void;
  onAprobarItem: (moduloId: string, itemIndex: number, estado: 'aprobado' | 'rechazado') => void;
  generandoRemito: string | null;
  remitoMsg: { id: string; msg: string; ok: boolean } | null;
}) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({
    horas_asignadas: modulo.horas_asignadas?.toString() ?? '',
    precio_hora: modulo.precio_hora?.toString() ?? '',
    deadline: modulo.deadline ? new Date(modulo.deadline).toISOString().slice(0, 10) : '',
  });
  const [guardando, setGuardando] = useState(false);

  const ESTADO_COLOR: Record<string, React.CSSProperties> = {
    en_progreso: { background: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
    en_riesgo: { background: 'rgba(251,146,60,0.15)', color: '#fb923c' },
    completado: { background: 'rgba(52,211,153,0.15)', color: '#34d399' },
    aprobado: { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' },
  };
  const ESTADO_LABEL: Record<string, string> = {
    en_progreso: 'En progreso', en_riesgo: 'En riesgo', completado: 'Completado', aprobado: 'Aprobado',
  };

  const protocolo = modulo.protocolo as { item: string; descripcion: string }[];
  const aprobados = modulo.evidencias.filter(e => e.estado === 'aprobado').length;
  const msgRemito = remitoMsg?.id === modulo.id ? remitoMsg : null;

  const totalHonorario =
    editForm.horas_asignadas && editForm.precio_hora
      ? (parseFloat(editForm.horas_asignadas) * parseFloat(editForm.precio_hora)).toLocaleString('es-AR', { minimumFractionDigits: 0 })
      : modulo.horas_asignadas && modulo.precio_hora
      ? (modulo.horas_asignadas * modulo.precio_hora).toLocaleString('es-AR', { minimumFractionDigits: 0 })
      : null;

  async function guardarEdicion() {
    setGuardando(true);
    await fetch(`/api/modulos/${modulo.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horas_asignadas: editForm.horas_asignadas || null,
        precio_hora: editForm.precio_hora || null,
        deadline: editForm.deadline || null,
      }),
    });
    // Actualizar valores locales en el objeto (el padre refrescará en próxima carga)
    modulo.horas_asignadas = editForm.horas_asignadas ? parseInt(editForm.horas_asignadas) : null;
    modulo.precio_hora = editForm.precio_hora ? parseFloat(editForm.precio_hora) : null;
    modulo.deadline = editForm.deadline ? new Date(editForm.deadline).toISOString() : null;
    setGuardando(false);
    setEditando(false);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full p-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 text-left">
          {modulo.usuario.foto_url ? (
            <img src={modulo.usuario.foto_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>
              {modulo.usuario.nombre_completo[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{modulo.usuario.nombre_completo}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{modulo.usuario.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {modulo.remito && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#2dd4bf', color: '#0d0d14' }}>#{modulo.remito.numero_remito}</span>
          )}
          {totalHonorario && !editando && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)' }}>
              ${totalHonorario}
            </span>
          )}
          {modulo.horas_asignadas && !editando && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{modulo.horas_asignadas} hs</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={ESTADO_COLOR[modulo.estado] ?? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
            {ESTADO_LABEL[modulo.estado] ?? modulo.estado}
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{aprobados}/{protocolo.length}</span>
          <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)' }}>
          {/* Bloque editable: horas, precio, deadline */}
          {editando ? (
            <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(45,212,191,0.3)' }}>
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Editar datos del módulo</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Hs asignadas</label>
                  <input type="number" min="1" value={editForm.horas_asignadas}
                    onChange={e => setEditForm(p => ({ ...p, horas_asignadas: e.target.value }))}
                    className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    placeholder="Ej: 40" />
                </div>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Precio/hora ($)</label>
                  <input type="number" min="0" step="0.01" value={editForm.precio_hora}
                    onChange={e => setEditForm(p => ({ ...p, precio_hora: e.target.value }))}
                    className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    placeholder="Ej: 3500" />
                </div>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Deadline</label>
                  <input type="date" value={editForm.deadline}
                    onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
              </div>
              {editForm.horas_asignadas && editForm.precio_hora && (
                <p className="text-xs font-semibold" style={{ color: '#2dd4bf' }}>
                  Total estimado: ${(parseFloat(editForm.horas_asignadas) * parseFloat(editForm.precio_hora)).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={guardarEdicion} disabled={guardando}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50" style={{ background: '#2dd4bf', color: '#0d0d14' }}>
                  {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                </button>
                <button onClick={() => setEditando(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              {modulo.horas_asignadas && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>
                  <Clock size={11} /> {modulo.horas_asignadas} hs
                </span>
              )}
              {modulo.precio_hora && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  ${Number(modulo.precio_hora).toLocaleString('es-AR')}/hs
                </span>
              )}
              {totalHonorario && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>
                  Total: ${totalHonorario}
                </span>
              )}
              {modulo.deadline && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <Clock size={11} /> {new Date(modulo.deadline).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              <button onClick={() => { setEditForm({ horas_asignadas: modulo.horas_asignadas?.toString() ?? '', precio_hora: modulo.precio_hora?.toString() ?? '', deadline: modulo.deadline ? new Date(modulo.deadline).toISOString().slice(0, 10) : '' }); setEditando(true); }}
                className="text-xs hover:underline flex items-center gap-1 ml-auto" style={{ color: '#2dd4bf' }}>
                <Pencil size={11} /> Editar
              </button>
            </div>
          )}
          {/* Cambiar estado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Estado:</span>
            {(['en_progreso', 'en_riesgo', 'completado', 'aprobado'] as const).map(e => (
              <button key={e} onClick={() => onCambiarEstado(modulo.id, e)}
                className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                style={modulo.estado === e ? { ...(ESTADO_COLOR[e] ?? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }), border: '1px solid transparent' } : { border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                {ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
          {/* Protocolo + evidencias */}
          <div className="space-y-2">
            {protocolo.map((item, idx) => {
              const ev = modulo.evidencias.find(e => e.item_index === idx);
              return (
                <div key={idx} className="rounded-lg p-3" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: ev?.estado === 'aprobado' ? '1px solid rgba(52,211,153,0.3)' :
                    ev?.estado === 'rechazado' ? '1px solid rgba(248,113,113,0.3)' :
                    ev ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.item}</p>
                      {item.descripcion && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.descripcion}</p>}
                      {ev && (
                        <p className="text-xs mt-1.5 rounded px-2 py-1" style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Evidencia: </span>{ev.texto}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {ev?.estado === 'aprobado' && <CheckCircle2 size={16} style={{ color: '#34d399' }} />}
                      {ev?.estado === 'rechazado' && <XCircle size={16} style={{ color: '#f87171' }} />}
                      {ev && ev.estado === 'pendiente' && (
                        <>
                          <button onClick={() => onAprobarItem(modulo.id, idx, 'aprobado')}
                            className="text-xs px-2 py-1 rounded-lg flex items-center gap-0.5" style={{ background: '#34d399', color: '#0d0d14' }}>
                            <Check size={11} /> OK
                          </button>
                          <button onClick={() => onAprobarItem(modulo.id, idx, 'rechazado')}
                            className="text-xs px-2 py-1 rounded-lg flex items-center gap-0.5" style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                            <X size={11} /> Rechazar
                          </button>
                        </>
                      )}
                      {!ev && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin evidencia</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Generar remito */}
          {(modulo.estado === 'completado' || modulo.estado === 'aprobado') && (
            <div className="pt-2">
              {modulo.remito ? (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ color: '#2dd4bf', background: 'rgba(45,212,191,0.12)' }}>
                  <FileText size={14} />
                  Remito generado: <strong>{modulo.remito.numero_remito}</strong>
                </div>
              ) : (
                <button onClick={() => onGenerarRemito(modulo.id)}
                  disabled={generandoRemito === modulo.id}
                  className="text-sm px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50" style={{ background: '#2dd4bf', color: '#0d0d14' }}>
                  {generandoRemito === modulo.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Generar remito
                </button>
              )}
              {msgRemito && (
                <p className="text-xs mt-1" style={{ color: msgRemito.ok ? '#2dd4bf' : '#f87171' }}>{msgRemito.msg}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmpresaDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'ofertas' | 'nueva' | 'editar' | 'postulantes' | 'perfil' | 'citas' | 'capacitaciones' | 'servicios'>('ofertas');
  const [citas, setCitas] = useState<CitaEmpresa[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<Oferta | null>(null);
  const [ofertaEditando, setOfertaEditando] = useState<Oferta | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [ofertaLinkCopiada, setOfertaLinkCopiada] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<Postulante | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroEdadMin, setFiltroEdadMin] = useState<string>('');
  const [filtroEdadMax, setFiltroEdadMax] = useState<string>('');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('');
  const [filtroDocsCompletos, setFiltroDocsCompletos] = useState<boolean>(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [citaModalOpen, setCitaModalOpen] = useState(false);
  const [citaForm, setCitaForm] = useState({ fecha: '', hora: '', modalidad: 'virtual', lugar: '', mensaje: '' });
  const [citaEnviando, setCitaEnviando] = useState(false);
  const [citaResultado, setCitaResultado] = useState<{ candidato: string; telefono: string; url: string }[] | null>(null);
  const [citaError, setCitaError] = useState<string | null>(null);

  // Capacitaciones
  const [capacitaciones, setCapacitaciones] = useState<Cap[]>([]);
  const [newCapOpen, setNewCapOpen] = useState(false);
  const [savingCap, setSavingCap] = useState(false);
  const [capMsg, setCapMsg] = useState<string | null>(null);
  const [capForm, setCapForm] = useState({
    titulo: '', descripcion: '', video_url: '', rubro: '',
    pregunta: '', opciones: ['', '', '', ''], respuesta_correcta: 0,
  });

  // Servicios (módulos de trabajo)
  type ServicioEmpresa = {
    id: string; titulo: string; descripcion: string; frecuencia: string; duracion_jornada: string | null; horas_modulo: number | null; precio_hora: number | null; estado: string;
    deadline: string | null; contrato_template: string | null; docs_requeridos: string[];
    protocolo: { item: string; descripcion: string }[];
    capacitacion: { id: string; titulo: string } | null;
    created_at: string;
    _count: { postulaciones: number; modulos_asignados: number };
  };
  type PostulanteServicio = {
    id: string; estado: string; created_at: string;
    usuario: {
      id: string; nombre_completo: string; email: string; telefono: string;
      slug: string; bio: string | null; foto_url: string | null; direccion: string | null;
      cv_datos: { resumen?: string; habilidades?: string[] } | null;
      alfa_score: number | null;
      videos: { id: string; video_url: string; tipo: string }[];
    };
  };
  type ModuloConDetalle = {
    id: string; estado: string; fecha_inicio: string; deadline: string | null;
    horas_asignadas: number | null; precio_hora: number | null;
    protocolo: { item: string; descripcion: string }[];
    usuario: { id: string; nombre_completo: string; email: string; telefono: string; slug: string; foto_url: string | null };
    evidencias: { id: string; item_index: number; texto: string | null; archivo_url: string | null; estado: string }[];
    remito: { id: string; numero_remito: string; pdf_url: string | null } | null;
  };
  const [serviciosEmpresa, setServiciosEmpresa] = useState<ServicioEmpresa[]>([]);
  const [newServicioOpen, setNewServicioOpen] = useState(false);
  const [editandoServicioId, setEditandoServicioId] = useState<string | null>(null);
  const [savingServicio, setSavingServicio] = useState(false);
  const [servicioMsg, setServicioMsg] = useState<string | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioEmpresa | null>(null);
  const [postulantesServicio, setPostulantesServicio] = useState<PostulanteServicio[]>([]);
  const [loadingPostulantesServ, setLoadingPostulantesServ] = useState(false);
  const [procesandoPostServ, setProcesandoPostServ] = useState<string | null>(null);
  const [aceptandoConHoras, setAceptandoConHoras] = useState<string | null>(null);
  const [horasInput, setHorasInput] = useState<Record<string, string>>({});
  const [modulosServicio, setModulosServicio] = useState<ModuloConDetalle[]>([]);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [generandoRemito, setGenerandoRemito] = useState<string | null>(null);
  const [remitoMsg, setRemitoMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const PROTOCOLO_ITEM_EMPTY = { item: '', descripcion: '' };
  const [servicioForm, setServicioForm] = useState({
    titulo: '', descripcion: '', frecuencia: 'mensual', duracion_jornada: '',
    horas_modulo: '', precio_hora: '', deadline: '',
    capacitacion_id: '', contrato_template: '',
    docs_requeridos: [] as string[],
    protocolo: [{ ...PROTOCOLO_ITEM_EMPTY }],
  });
  const [otroLabelServicio, setOtroLabelServicio] = useState('');
  const [vistaServicio, setVistaServicio] = useState<'postulantes' | 'modulos'>('postulantes');

  function toggleSeleccionado(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function cargarServiciosEmpresa() {
    const res = await fetch('/api/empresa/servicios');
    const data = await res.json();
    if (data.servicios) setServiciosEmpresa(data.servicios);
  }

  function toggleDocServicio(tipo: string) {
    setServicioForm(prev => {
      const tiene = prev.docs_requeridos.some(d => parseDocTipo(d) === tipo);
      if (tiene) return { ...prev, docs_requeridos: prev.docs_requeridos.filter(d => parseDocTipo(d) !== tipo) };
      if (tipo === 'otro') {
        const label = otroLabelServicio.trim();
        return { ...prev, docs_requeridos: [...prev.docs_requeridos.filter(d => parseDocTipo(d) !== 'otro'), label ? `otro:${label}` : 'otro'] };
      }
      return { ...prev, docs_requeridos: [...prev.docs_requeridos, tipo] };
    });
  }

  function editarServicio(s: ServicioEmpresa) {
    setEditandoServicioId(s.id);
    const docs = (s.docs_requeridos as string[]) ?? [];
    const otroDoc = docs.find(d => d.startsWith('otro:'));
    setOtroLabelServicio(otroDoc ? otroDoc.slice(5) : '');
    setServicioForm({
      titulo: s.titulo,
      descripcion: s.descripcion,
      frecuencia: s.frecuencia,
      duracion_jornada: s.duracion_jornada ?? '',
      horas_modulo: s.horas_modulo?.toString() ?? '',
      precio_hora: s.precio_hora?.toString() ?? '',
      deadline: s.deadline ? new Date(s.deadline).toISOString().slice(0, 10) : '',
      capacitacion_id: s.capacitacion?.id ?? '',
      contrato_template: s.contrato_template ?? '',
      docs_requeridos: docs,
      protocolo: (s.protocolo as { item: string; descripcion: string }[]).length > 0
        ? (s.protocolo as { item: string; descripcion: string }[])
        : [{ ...PROTOCOLO_ITEM_EMPTY }],
    });
    setNewServicioOpen(true);
  }

  async function crearServicio() {
    if (!servicioForm.titulo.trim() || !servicioForm.descripcion.trim() || servicioForm.protocolo.every(p => !p.item.trim())) {
      setServicioMsg('Completá título, descripción y al menos un item del protocolo.');
      return;
    }
    setSavingServicio(true);
    setServicioMsg(null);
    const payload = {
      ...servicioForm,
      protocolo: servicioForm.protocolo.filter(p => p.item.trim()),
      deadline: servicioForm.deadline || null,
      capacitacion_id: servicioForm.capacitacion_id || null,
      contrato_template: servicioForm.contrato_template || null,
    };
    const res = editandoServicioId
      ? await fetch(`/api/servicios/${editandoServicioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/servicios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    const data = await res.json();
    if (data.ok) {
      setServicioMsg(editandoServicioId ? '✓ Servicio actualizado' : '✓ Servicio creado correctamente');
      setNewServicioOpen(false);
      setEditandoServicioId(null);
      setServicioForm({ titulo: '', descripcion: '', frecuencia: 'mensual', duracion_jornada: '', horas_modulo: '', precio_hora: '', deadline: '', capacitacion_id: '', contrato_template: '', docs_requeridos: [], protocolo: [{ ...PROTOCOLO_ITEM_EMPTY }] });
      cargarServiciosEmpresa();
    } else {
      setServicioMsg(data.error ?? (editandoServicioId ? 'Error al actualizar el servicio' : 'Error al crear el servicio'));
    }
    setSavingServicio(false);
    setTimeout(() => setServicioMsg(null), 5000);
  }

  async function cerrarServicio(id: string) {
    await fetch(`/api/servicios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cerrado' }),
    });
    cargarServiciosEmpresa();
  }

  async function verPostulantesServicio(servicio: ServicioEmpresa) {
    setServicioSeleccionado(servicio);
    setVistaServicio('postulantes');
    setPostulantesServicio([]);
    setModulosServicio([]);
    setLoadingPostulantesServ(true);
    // Cargar postulantes y módulos en paralelo para que el tab "Módulos activos" esté listo
    const [postRes] = await Promise.all([
      fetch(`/api/empresa/servicios/${servicio.id}/postulantes`),
      cargarModulosServicio(servicio.id),
    ]);
    const data = await postRes.json();
    if (data.postulaciones) setPostulantesServicio(data.postulaciones);
    setLoadingPostulantesServ(false);
  }

  async function cargarModulosServicio(servicio_id: string) {
    setLoadingModulos(true);
    try {
      const res = await fetch(`/api/empresa/servicios/${servicio_id}/modulos`);
      const data = await res.json();
      if (data.modulos) setModulosServicio(data.modulos);
    } catch (err) {
      console.error('[cargarModulosServicio]', err);
    } finally {
      setLoadingModulos(false);
    }
  }

  async function procesarPostulanteServicio(postulacion_id: string, estado: 'aceptado' | 'rechazado', horas?: number) {
    if (!servicioSeleccionado) return;
    setProcesandoPostServ(postulacion_id);
    setAceptandoConHoras(null);
    const res = await fetch(`/api/empresa/servicios/${servicioSeleccionado.id}/postulantes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postulacion_id, estado, horas_asignadas: horas ?? null }),
    });
    const data = await res.json();
    if (data.ok) {
      setPostulantesServicio(prev => prev.map(p => p.id === postulacion_id ? { ...p, estado } : p));
      if (estado === 'aceptado') {
        // Refrescar módulos y mostrar la pestaña de módulos
        setVistaServicio('modulos');
        await cargarModulosServicio(servicioSeleccionado.id);
      }
    }
    setProcesandoPostServ(null);
  }

  async function generarRemito(modulo_id: string) {
    setGenerandoRemito(modulo_id);
    setRemitoMsg(null);
    const res = await fetch(`/api/modulos/${modulo_id}/remito`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setRemitoMsg({ id: modulo_id, msg: `Remito ${data.remito.numero_remito} generado`, ok: true });
      setModulosServicio(prev => prev.map(m => m.id === modulo_id
        ? { ...m, estado: 'aprobado', remito: data.remito }
        : m
      ));
    } else {
      setRemitoMsg({ id: modulo_id, msg: data.error ?? 'Error al generar remito', ok: false });
    }
    setGenerandoRemito(null);
    setTimeout(() => setRemitoMsg(null), 6000);
  }

  async function cambiarEstadoModulo(modulo_id: string, estado: string) {
    await fetch(`/api/modulos/${modulo_id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    setModulosServicio(prev => prev.map(m => m.id === modulo_id ? { ...m, estado } : m));
  }

  async function aprobarItemEvidencia(modulo_id: string, item_index: number, estado: 'aprobado' | 'rechazado') {
    await fetch(`/api/modulos/${modulo_id}/aprobar-item`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_index, estado }),
    });
    setModulosServicio(prev => prev.map(m => m.id === modulo_id
      ? { ...m, evidencias: m.evidencias.map(e => e.item_index === item_index ? { ...e, estado } : e) }
      : m
    ));
  }

  async function enviarCita() {
    if (!citaForm.fecha || !citaForm.hora || !citaForm.lugar) {
      setCitaError('Completá la fecha, hora y lugar/link de la cita.');
      return;
    }
    setCitaEnviando(true);
    setCitaError(null);
    try {
      const res = await fetch('/api/empresa/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postulacion_ids: Array.from(seleccionados),
          oferta_id: ofertaSeleccionada?.id,
          fecha: `${citaForm.fecha}T${citaForm.hora}`,
          modalidad: citaForm.modalidad,
          lugar: citaForm.lugar,
          mensaje: citaForm.mensaje,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCitaError(data.error ?? 'Error al agendar la cita');
        return;
      }
      setCitaResultado(data.whatsappLinks ?? []);
      cargarCitas();
    } catch {
      setCitaError('Error al agendar la cita');
    } finally {
      setCitaEnviando(false);
    }
  }

  function cerrarCitaModal() {
    setCitaModalOpen(false);
    setCitaResultado(null);
    setCitaError(null);
    setCitaForm({ fecha: '', hora: '', modalidad: 'virtual', lugar: '', mensaje: '' });
    setSeleccionados(new Set());
  }

  async function cargarCapacitaciones() {
    const res = await fetch('/api/empresa/capacitaciones');
    const data = await res.json();
    if (data.capacitaciones) setCapacitaciones(data.capacitaciones);
  }

  async function crearCapacitacion() {
    const { titulo, video_url, pregunta, opciones } = capForm;
    const faltantes = [];
    if (!titulo.trim()) faltantes.push('título');
    if (!video_url.trim()) faltantes.push('URL de YouTube');
    if (!pregunta.trim()) faltantes.push('pregunta de verificación');
    if (opciones.some(o => !o.trim())) faltantes.push('las 4 opciones de respuesta');
    if (faltantes.length > 0) {
      setCapMsg(`Falta completar: ${faltantes.join(', ')}.`);
      setTimeout(() => setCapMsg(null), 4000);
      return;
    }
    setSavingCap(true);
    try {
      const res = await fetch('/api/empresa/capacitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capForm),
      });
      const data = await res.json();
      if (data.ok) {
        setCapMsg('Capacitación creada ✓');
        setNewCapOpen(false);
        setCapForm({ titulo: '', descripcion: '', video_url: '', rubro: '', pregunta: '', opciones: ['', '', '', ''], respuesta_correcta: 0 });
        cargarCapacitaciones();
      } else {
        setCapMsg(data.error ?? 'Error al crear');
      }
    } catch {
      setCapMsg('Error de conexión. Intentá de nuevo.');
    } finally {
      setSavingCap(false);
      setTimeout(() => setCapMsg(null), 4000);
    }
  }

  async function toggleCapActiva(id: string, activa: boolean) {
    await fetch(`/api/empresa/capacitaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !activa }),
    });
    setCapacitaciones(p => p.map(c => c.id === id ? { ...c, activa: !activa } : c));
  }

  async function eliminarCapacitacion(id: string) {
    if (!confirm('¿Eliminar esta capacitación? Los candidatos perderán el acceso.')) return;
    await fetch(`/api/empresa/capacitaciones/${id}`, { method: 'DELETE' });
    setCapacitaciones(p => p.filter(c => c.id !== id));
  }

  const [form, setForm] = useState({
    titulo: '', descripcion: '', requisitos: '', area: '',
    modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '',
    nombre_marca: '', logo_url: '', titulo_hero: '',
    docs_requeridos: [] as string[],
    preguntas_videocv: [] as string[],
  });
  const [logoUploadingNueva, setLogoUploadingNueva] = useState(false);
  const [preguntaInput, setPreguntaInput] = useState('');
  const [otroLabel, setOtroLabel] = useState('');
  const [editOtroLabel, setEditOtroLabel] = useState('');
  const [editForm, setEditForm] = useState({
    titulo: '', descripcion: '', requisitos: '', area: '',
    modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '',
    nombre_marca: '', logo_url: '', titulo_hero: '',
    docs_requeridos: [] as string[],
    preguntas_videocv: [] as string[],
  });
  const [logoUploadingEditar, setLogoUploadingEditar] = useState(false);
  const [editPreguntaInput, setEditPreguntaInput] = useState('');

  const [perfilForm, setPerfilForm] = useState({
    nombre: '', descripcion: '', rubro: '', ciudad: '', sitio_web: '', mensaje_bienvenida: '',
  });

  useEffect(() => { cargarOfertas(); cargarEmpresa(); cargarCitas(); cargarCapacitaciones(); cargarServiciosEmpresa(); }, []);

  async function cargarCitas() {
    const res = await fetch('/api/empresa/citas');
    const data = await res.json();
    if (data.citas) setCitas(data.citas);
  }

  async function cargarOfertas() {
    const res = await fetch('/api/empresa/ofertas');
    const data = await res.json();
    if (data.ofertas) setOfertas(data.ofertas);
  }

  async function cargarEmpresa() {
    const res = await fetch('/api/empresa/perfil');
    const data = await res.json();
    if (data.empresa) {
      setEmpresa({ ...data.empresa, imagenes: data.empresa.imagenes ?? [], color_primario: data.empresa.color_primario ?? null, fuente: data.empresa.fuente ?? null });
      setPerfilForm({ nombre: data.empresa.nombre || '', descripcion: data.empresa.descripcion || '', rubro: data.empresa.rubro || '', ciudad: data.empresa.ciudad || '', sitio_web: data.empresa.sitio_web || '', mensaje_bienvenida: data.empresa.mensaje_bienvenida || '' });
    }
  }

  async function guardarPerfil() {
    setLoading(true);
    await fetch('/api/empresa/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(perfilForm) });
    setPerfilGuardado(true);
    setTimeout(() => setPerfilGuardado(false), 2000);
    cargarEmpresa();
    setLoading(false);
  }

  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/empresa/logo', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.logo_url) setEmpresa(prev => prev ? { ...prev, logo_url: data.logo_url } : prev);
  }

  const [subiendoImagen, setSubiendoImagen] = useState(false);

  async function subirImagenEmpresa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;
    setSubiendoImagen(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `empresa-fotos/${empresa.id}-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('videos').upload(filename, file, { contentType: file.type, upsert: true });
      if (!error) {
        const { data } = sb.storage.from('videos').getPublicUrl(filename);
        const nuevasImagenes = [...(empresa.imagenes ?? []), data.publicUrl];
        await fetch('/api/empresa/perfil', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagenes: nuevasImagenes }),
        });
        setEmpresa(prev => prev ? { ...prev, imagenes: nuevasImagenes } : prev);
      }
    } finally {
      setSubiendoImagen(false);
      e.target.value = '';
    }
  }

  async function eliminarImagenEmpresa(url: string) {
    if (!empresa) return;
    const nuevasImagenes = (empresa.imagenes ?? []).filter(u => u !== url);
    await fetch('/api/empresa/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagenes: nuevasImagenes }),
    });
    setEmpresa(prev => prev ? { ...prev, imagenes: nuevasImagenes } : prev);
  }

  function limpiarFiltros() {
    setFiltroEdadMin('');
    setFiltroEdadMax('');
    setFiltroCiudad('');
    setFiltroDocsCompletos(false);
  }

  async function verPostulantes(oferta: Oferta) {
    setOfertaSeleccionada(oferta);
    setTab('postulantes');
    setFiltroEstado('todos');
    limpiarFiltros();
    const res = await fetch(`/api/ofertas/${oferta.id}/postulantes`);
    const data = await res.json();
    if (data.postulaciones) {
      const postsConDocs = await Promise.all(
        data.postulaciones.map(async (p: Postulante) => {
          const resDoc = await fetch(`/api/empresa/candidato/${p.usuario.id}/documentos`);
          const dataDoc = await resDoc.json();
          return { ...p, documentos: dataDoc.documentos || [] };
        })
      );
      setPostulantes(postsConDocs);
    }
  }

  async function cambiarEstado(postulacion_id: string, estado: string) {
    await fetch(`/api/ofertas/${ofertaSeleccionada?.id}/postulantes`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postulacion_id, estado }),
    });
    setPostulantes(prev => prev.map(p => p.id === postulacion_id ? { ...p, estado } : p));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');

  function shareText(nombre: string, url: string) {
    return `En ${nombre} queremos conocerte. Mostranos quién sos con un VideoCV. ${url}`;
  }

  function copiarLink() {
    if (!empresa?.slug) return;
    const url = `${appUrl}/empresa/${empresa.slug}`;
    navigator.clipboard.writeText(shareText(empresa.nombre, url)).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    });
  }

  function copiarLinkOferta(oferta: Oferta) {
    const url = `${appUrl}/ofertas/${oferta.id}`;
    const nombre = oferta.nombre_marca || empresa?.nombre || '';
    navigator.clipboard.writeText(shareText(nombre, url)).then(() => {
      setOfertaLinkCopiada(oferta.id);
      setTimeout(() => setOfertaLinkCopiada(null), 2000);
    });
  }

  async function crearOferta() {
    setLoading(true);
    // Auto-add any question that was typed but not explicitly added via "+"
    const pendiente = preguntaInput.trim();
    const formFinal = pendiente && !form.preguntas_videocv.includes(pendiente)
      ? { ...form, preguntas_videocv: [...form.preguntas_videocv, pendiente] }
      : form;
    const res = await fetch('/api/ofertas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formFinal) });
    const data = await res.json();
    if (data.ok) {
      setForm({ titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '', nombre_marca: '', logo_url: '', titulo_hero: '', docs_requeridos: [], preguntas_videocv: [] });
      setPreguntaInput('');
      setTab('ofertas');
      cargarOfertas();
    }
    setLoading(false);
  }

  function abrirEditar(oferta: Oferta) {
    setOfertaEditando(oferta);
    const otroDoc = (oferta.docs_requeridos || []).find(d => d.startsWith('otro:'));
    setEditOtroLabel(otroDoc ? otroDoc.slice(5) : '');
    setEditForm({
      titulo: oferta.titulo,
      descripcion: oferta.descripcion || '',
      requisitos: oferta.requisitos || '',
      area: oferta.area || '',
      modalidad: oferta.modalidad,
      ciudad: oferta.ciudad || '',
      mensaje_whatsapp: oferta.mensaje_whatsapp || '',
      nombre_marca: oferta.nombre_marca || '',
      logo_url: oferta.logo_url || '',
      titulo_hero: (oferta as any).titulo_hero || '',
      docs_requeridos: oferta.docs_requeridos || [],
      preguntas_videocv: oferta.preguntas_videocv || [],
    });
    setEditPreguntaInput('');
    setTab('editar');
  }

  async function guardarEdicion() {
    if (!ofertaEditando) return;
    setLoading(true);
    const pendiente = editPreguntaInput.trim();
    const formFinal = pendiente && !editForm.preguntas_videocv.includes(pendiente)
      ? { ...editForm, preguntas_videocv: [...editForm.preguntas_videocv, pendiente] }
      : editForm;
    await fetch(`/api/ofertas/${ofertaEditando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formFinal),
    });
    setTab('ofertas');
    setOfertaEditando(null);
    cargarOfertas();
    setLoading(false);
  }

  async function toggleEstadoOferta(oferta: Oferta) {
    const nuevoEstado = oferta.estado === 'activa' ? 'cerrada' : 'activa';
    await fetch(`/api/ofertas/${oferta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    cargarOfertas();
  }

  function toggleDocRequerido(tipo: string) {
    setForm(prev => {
      const tiene = prev.docs_requeridos.some(d => parseDocTipo(d) === tipo);
      if (tiene) return { ...prev, docs_requeridos: prev.docs_requeridos.filter(d => parseDocTipo(d) !== tipo) };
      const valor = tipo === 'otro' ? (otroLabel.trim() ? `otro:${otroLabel.trim()}` : 'otro') : tipo;
      return { ...prev, docs_requeridos: [...prev.docs_requeridos, valor] };
    });
  }

  function toggleEditDocRequerido(tipo: string) {
    setEditForm(prev => {
      const tiene = prev.docs_requeridos.some(d => parseDocTipo(d) === tipo);
      if (tiene) return { ...prev, docs_requeridos: prev.docs_requeridos.filter(d => parseDocTipo(d) !== tipo) };
      const valor = tipo === 'otro' ? (editOtroLabel.trim() ? `otro:${editOtroLabel.trim()}` : 'otro') : tipo;
      return { ...prev, docs_requeridos: [...prev.docs_requeridos, valor] };
    });
  }

  function agregarPregunta() {
    const p = preguntaInput.trim();
    if (!p || form.preguntas_videocv.includes(p)) return;
    setForm(prev => ({ ...prev, preguntas_videocv: [...prev.preguntas_videocv, p] }));
    setPreguntaInput('');
  }

  function eliminarPregunta(idx: number) {
    setForm(prev => ({ ...prev, preguntas_videocv: prev.preguntas_videocv.filter((_, i) => i !== idx) }));
  }

  function whatsappUrl(telefono: string, mensaje: string, candidato: string) {
    const tel = telefono.replace(/\D/g, '');
    const numero = tel.startsWith('54') ? tel : `54${tel}`;
    const intro = `Hola ${candidato}, te contacto desde ${empresa?.nombre || 'nuestra empresa'}. `;
    return `https://wa.me/${numero}?text=${encodeURIComponent(intro + (mensaje || ''))}`;
  }

  const getPipelineInfo = (estado: string) => PIPELINE.find(p => p.estado === estado) || PIPELINE[0];

  const hayFiltrosActivos = filtroEdadMin !== '' || filtroEdadMax !== '' || filtroCiudad !== '' || filtroDocsCompletos;

  const postulanteFiltrados = postulantes
    .filter(p => filtroEstado === 'todos' || p.estado === filtroEstado)
    .filter(p => {
      if (!filtroEdadMin && !filtroEdadMax) return true;
      const edad = calcularEdadNumero(p.usuario.fecha_nacimiento);
      if (edad === null) return filtroEdadMin === '';
      if (filtroEdadMin && edad < parseInt(filtroEdadMin)) return false;
      if (filtroEdadMax && edad > parseInt(filtroEdadMax)) return false;
      return true;
    })
    .filter(p => {
      if (!filtroCiudad) return true;
      const ciudad = extraerCiudad(p.usuario.direccion);
      return ciudad.toLowerCase().includes(filtroCiudad.toLowerCase());
    })
    .filter(p => {
      if (!filtroDocsCompletos) return true;
      if (!ofertaSeleccionada?.docs_requeridos?.length) return true;
      return ofertaSeleccionada.docs_requeridos.every(tipo =>
        p.documentos?.some(d => d.tipo === tipo)
      );
    });

  const conteosPorEstado = PIPELINE.reduce((acc, p) => { acc[p.estado] = postulantes.filter(post => post.estado === p.estado).length; return acc; }, {} as Record<string, number>);

  const tabs = [
    { key: 'ofertas', label: 'Mis ofertas' },
    { key: 'postulantes', label: ofertaSeleccionada ? `Candidatos — ${ofertaSeleccionada.titulo}` : 'Candidatos' },
    { key: 'citas', label: `Citas${citas.length > 0 ? ` (${citas.length})` : ''}` },
    { key: 'capacitaciones', label: `Capacitaciones${capacitaciones.length > 0 ? ` (${capacitaciones.length})` : ''}` },
    { key: 'servicios', label: `Servicios${serviciosEmpresa.length > 0 ? ` (${serviciosEmpresa.length})` : ''}` },
    { key: 'perfil', label: 'Perfil empresa' },
  ];

  const citasPorDia = citas.reduce((acc, c) => {
    const dia = new Date(c.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    (acc[dia] ??= []).push(c);
    return acc;
  }, {} as Record<string, CitaEmpresa[]>);

  return (
    <div className="min-h-screen" style={{ background: '#0d0d14' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>{empresa?.nombre?.[0] || 'E'}</div>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{empresa?.nombre || 'Panel de empresa'}</h1>
              {empresa?.rubro && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{empresa.rubro}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('nueva')} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>+ Nueva oferta</button>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
              title="Cerrar sesión"
            >
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>

        {/* Banner página pública */}
        {empresa?.slug && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl px-4 py-3 mb-6" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <Globe size={15} style={{ color: '#2dd4bf' }} className="flex-shrink-0" />
              <span className="text-sm font-medium flex-shrink-0" style={{ color: '#2dd4bf' }}>Tu página pública:</span>
              <a
                href={`/empresa/${empresa.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline font-mono truncate flex items-center gap-1" style={{ color: '#2dd4bf' }}
              >
                {appUrl.replace(/https?:\/\//, '')}/empresa/{empresa.slug}
                <ExternalLink size={12} className="flex-shrink-0" />
              </a>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copiarLink}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ border: '1px solid rgba(45,212,191,0.4)', color: '#2dd4bf' }}
              >
                <Copy size={13} />
                {linkCopiado ? '¡Copiado!' : 'Copiar link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText(empresa.nombre, `${appUrl}/empresa/${empresa.slug}`))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ background: '#34d399', color: '#0d0d14' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Compartir
              </a>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-6 rounded-lg p-1 w-fit flex-wrap" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={tab === t.key ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' } : { color: 'rgba(255,255,255,0.6)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Ofertas */}
        {tab === 'ofertas' && (
          <div className="space-y-4">
            {ofertas.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-lg mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Todavía no publicaste ninguna oferta</p>
                <button onClick={() => setTab('nueva')} className="px-6 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>Publicar primera oferta</button>
              </div>
            ) : (
              ofertas.map(oferta => (
                <div key={oferta.id} className="rounded-xl p-5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{oferta.titulo}</h3>
                    <div className="flex gap-3 mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {oferta.area && <span>{oferta.area}</span>}
                      {oferta.ciudad && <span>· {oferta.ciudad}</span>}
                      <span>· {oferta.modalidad}</span>
                    </div>
                    {oferta.docs_requeridos?.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: '#a78bfa' }}>📋 Requiere: {oferta.docs_requeridos.map(d => parseDocLabel(d)).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center mr-2">
                      <div className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{oferta._count.postulaciones}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>postulantes</div>
                    </div>
                    <button onClick={() => toggleEstadoOferta(oferta)}
                      title={oferta.estado === 'activa' ? 'Cerrar oferta' : 'Activar oferta'}
                      className="p-2 rounded-lg border transition-colors"
                      style={oferta.estado === 'activa' ? { border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' } : { border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                      {oferta.estado === 'activa' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => abrirEditar(oferta)}
                      className="p-2 rounded-lg border transition-colors" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }} title="Editar oferta">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => copiarLinkOferta(oferta)}
                      title="Copiar enlace de la oferta"
                      className="p-2 rounded-lg border transition-colors text-xs" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      {ofertaLinkCopiada === oferta.id ? <Check size={15} style={{ color: '#34d399' }} /> : <Copy size={15} />}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText(oferta.nombre_marca || empresa?.nombre || '', `${appUrl}/ofertas/${oferta.id}`))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir por WhatsApp"
                      className="p-2 rounded-lg border transition-colors" style={{ border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                    <button onClick={() => verPostulantes(oferta)} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>Ver candidatos →</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Nueva oferta */}
        {tab === 'nueva' && (
          <div className="rounded-xl p-6 max-w-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Nueva oferta de trabajo</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Título *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Descripción *</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={4} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Requisitos</label>
                <textarea value={form.requisitos} onChange={e => setForm({ ...form, requisitos: e.target.value })} rows={3} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Área</label>
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Modalidad</label>
                  <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Ciudad</label>
                  <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Documentos requeridos</label>
                <div className="space-y-2">
                  {DOCS_CONFIG.map(doc => (
                    <div key={doc.tipo}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox"
                          checked={form.docs_requeridos.some(d => parseDocTipo(d) === doc.tipo)}
                          onChange={() => toggleDocRequerido(doc.tipo)}
                          className="w-4 h-4 accent-blue-600" />
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{doc.label}</span>
                      </label>
                      {doc.tipo === 'otro' && form.docs_requeridos.some(d => parseDocTipo(d) === 'otro') && (
                        <input
                          value={otroLabel}
                          onChange={e => {
                            setOtroLabel(e.target.value);
                            setForm(prev => ({
                              ...prev,
                              docs_requeridos: prev.docs_requeridos.map(d =>
                                parseDocTipo(d) === 'otro' ? (e.target.value.trim() ? `otro:${e.target.value.trim()}` : 'otro') : d
                              ),
                            }));
                          }}
                          placeholder="¿Qué documento es? (ej: Carnet de salud)"
                          className="ml-7 mt-1 w-64 rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Preguntas para el Video CV</label>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Los candidatos verán estas preguntas al postularse, como guía para su video.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={preguntaInput}
                    onChange={e => setPreguntaInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarPregunta())}
                    placeholder="Ej: ¿Cuál es tu experiencia en el rubro?"
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                  />
                  <button type="button" onClick={agregarPregunta} className="px-3 py-2 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                    <Plus size={16} />
                  </button>
                </div>
                {form.preguntas_videocv.length > 0 && (
                  <div className="space-y-1.5">
                    {form.preguntas_videocv.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(96,165,250,0.12)' }}>
                        <span className="text-xs flex-1" style={{ color: '#60a5fa' }}>{i + 1}. {p}</span>
                        <button type="button" onClick={() => eliminarPregunta(i)} className="transition-colors" style={{ color: 'rgba(96,165,250,0.6)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Mensaje WhatsApp (opcional)</label>
                <textarea value={form.mensaje_whatsapp} onChange={e => setForm({ ...form, mensaje_whatsapp: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Se enviará: "Hola [nombre], te contacto desde [empresa]. [tu mensaje]"</p>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Marca (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Nombre de la marca</label>
                    <input value={form.nombre_marca} onChange={e => setForm({ ...form, nombre_marca: e.target.value })} placeholder={empresa?.nombre ?? ''} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Logo de la marca</label>
                    {form.logo_url && <img src={form.logo_url} alt="preview" className="w-10 h-10 rounded-lg object-cover mb-1" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />}
                    <label className="cursor-pointer flex items-center gap-2 text-sm" style={{ color: '#60a5fa' }}>
                      <input type="file" accept="image/*" className="hidden" disabled={logoUploadingNueva} onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setLogoUploadingNueva(true);
                        const { createClient } = await import('@supabase/supabase-js');
                        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
                        const ext = file.name.split('.').pop() || 'jpg';
                        const filename = `logos/oferta-${Date.now()}.${ext}`;
                        const { error } = await sb.storage.from('videos').upload(filename, file, { contentType: file.type, upsert: true });
                        if (!error) { const { data } = sb.storage.from('videos').getPublicUrl(filename); setForm(f => ({ ...f, logo_url: data.publicUrl })); }
                        setLogoUploadingNueva(false);
                      }} />
                      {logoUploadingNueva ? 'Subiendo...' : (form.logo_url ? 'Cambiar' : 'Subir logo')}
                    </label>
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Si esta oferta es de una submarca del grupo, podés poner su nombre y logo propio.</p>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Título del hero <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>(texto grande en la página de la oferta)</span>
                </label>
                <input
                  value={form.titulo_hero}
                  onChange={e => setForm({ ...form, titulo_hero: e.target.value })}
                  placeholder={form.titulo || 'Ej: Barista con experiencia'}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Si lo dejás vacío, se usa el título de la oferta.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={crearOferta} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>
                  {loading ? 'Publicando...' : 'Publicar oferta'}
                </button>
                <button onClick={() => setTab('ofertas')} className="px-6 py-2 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Editar oferta */}
        {tab === 'editar' && ofertaEditando && (
          <div className="rounded-xl p-6 max-w-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Editar oferta</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Título *</label>
                <input value={editForm.titulo} onChange={e => setEditForm({ ...editForm, titulo: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Descripción *</label>
                <textarea value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} rows={4} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Requisitos</label>
                <textarea value={editForm.requisitos} onChange={e => setEditForm({ ...editForm, requisitos: e.target.value })} rows={3} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Área</label>
                  <input value={editForm.area} onChange={e => setEditForm({ ...editForm, area: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Modalidad</label>
                  <select value={editForm.modalidad} onChange={e => setEditForm({ ...editForm, modalidad: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Ciudad</label>
                  <input value={editForm.ciudad} onChange={e => setEditForm({ ...editForm, ciudad: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Documentos requeridos</label>
                <div className="space-y-2">
                  {DOCS_CONFIG.map(doc => (
                    <div key={doc.tipo}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox"
                          checked={editForm.docs_requeridos.some(d => parseDocTipo(d) === doc.tipo)}
                          onChange={() => toggleEditDocRequerido(doc.tipo)}
                          className="w-4 h-4 accent-blue-600" />
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{doc.label}</span>
                      </label>
                      {doc.tipo === 'otro' && editForm.docs_requeridos.some(d => parseDocTipo(d) === 'otro') && (
                        <input
                          value={editOtroLabel}
                          onChange={e => {
                            setEditOtroLabel(e.target.value);
                            setEditForm(prev => ({
                              ...prev,
                              docs_requeridos: prev.docs_requeridos.map(d =>
                                parseDocTipo(d) === 'otro' ? (e.target.value.trim() ? `otro:${e.target.value.trim()}` : 'otro') : d
                              ),
                            }));
                          }}
                          placeholder="¿Qué documento es? (ej: Carnet de salud)"
                          className="ml-7 mt-1 w-64 rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Preguntas para el Video CV</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={editPreguntaInput}
                    onChange={e => setEditPreguntaInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const p = editPreguntaInput.trim();
                        if (p && !editForm.preguntas_videocv.includes(p)) {
                          setEditForm(prev => ({ ...prev, preguntas_videocv: [...prev.preguntas_videocv, p] }));
                          setEditPreguntaInput('');
                        }
                      }
                    }}
                    placeholder="Ej: ¿Cuál es tu experiencia en el rubro?"
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                  />
                  <button type="button" onClick={() => {
                    const p = editPreguntaInput.trim();
                    if (p && !editForm.preguntas_videocv.includes(p)) {
                      setEditForm(prev => ({ ...prev, preguntas_videocv: [...prev.preguntas_videocv, p] }));
                      setEditPreguntaInput('');
                    }
                  }} className="px-3 py-2 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                    <Plus size={16} />
                  </button>
                </div>
                {editForm.preguntas_videocv.length > 0 && (
                  <div className="space-y-1.5">
                    {editForm.preguntas_videocv.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(96,165,250,0.12)' }}>
                        <span className="text-xs flex-1" style={{ color: '#60a5fa' }}>{i + 1}. {p}</span>
                        <button type="button" onClick={() => setEditForm(prev => ({ ...prev, preguntas_videocv: prev.preguntas_videocv.filter((_, j) => j !== i) }))} className="transition-colors" style={{ color: 'rgba(96,165,250,0.6)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Mensaje WhatsApp (opcional)</label>
                <textarea value={editForm.mensaje_whatsapp} onChange={e => setEditForm({ ...editForm, mensaje_whatsapp: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Marca (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Nombre de la marca</label>
                    <input value={editForm.nombre_marca} onChange={e => setEditForm({ ...editForm, nombre_marca: e.target.value })} placeholder={empresa?.nombre ?? ''} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Logo de la marca</label>
                    {editForm.logo_url && <img src={editForm.logo_url} alt="preview" className="w-10 h-10 rounded-lg object-cover mb-1" style={{ border: '1px solid rgba(255,255,255,0.12)' }} />}
                    <label className="cursor-pointer flex items-center gap-2 text-sm" style={{ color: '#60a5fa' }}>
                      <input type="file" accept="image/*" className="hidden" disabled={logoUploadingEditar} onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setLogoUploadingEditar(true);
                        const { createClient } = await import('@supabase/supabase-js');
                        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
                        const ext = file.name.split('.').pop() || 'jpg';
                        const filename = `logos/oferta-${Date.now()}.${ext}`;
                        const { error } = await sb.storage.from('videos').upload(filename, file, { contentType: file.type, upsert: true });
                        if (!error) { const { data } = sb.storage.from('videos').getPublicUrl(filename); setEditForm(f => ({ ...f, logo_url: data.publicUrl })); }
                        setLogoUploadingEditar(false);
                      }} />
                      {logoUploadingEditar ? 'Subiendo...' : (editForm.logo_url ? 'Cambiar' : 'Subir logo')}
                    </label>
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Si esta oferta es de una submarca del grupo, podés poner su nombre y logo propio.</p>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Título del hero <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>(texto grande en la página de la oferta)</span>
                </label>
                <input
                  value={editForm.titulo_hero}
                  onChange={e => setEditForm({ ...editForm, titulo_hero: e.target.value })}
                  placeholder={editForm.titulo || 'Ej: Barista con experiencia'}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Si lo dejás vacío, se usa el título de la oferta.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={guardarEdicion} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button onClick={() => { setTab('ofertas'); setOfertaEditando(null); }} className="px-6 py-2 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Candidatos */}
        {tab === 'postulantes' && (
          <div>
            {/* Breadcrumb */}
            {ofertaSeleccionada && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <button onClick={() => setTab('ofertas')} className="hover:underline flex items-center gap-1" style={{ color: '#60a5fa' }}>
                  ← Mis ofertas
                </button>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
                <span className="font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{ofertaSeleccionada.titulo}</span>
              </div>
            )}
            {/* Panel de filtros avanzados */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Filtros</span>
                {hayFiltrosActivos && (
                  <button onClick={limpiarFiltros} className="ml-auto text-xs hover:underline" style={{ color: '#60a5fa' }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Edad</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="16" max="99" placeholder="Mín"
                      value={filtroEdadMin} onChange={e => setFiltroEdadMin(e.target.value)}
                      className="w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    />
                    <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                    <input
                      type="number" min="16" max="99" placeholder="Máx"
                      value={filtroEdadMax} onChange={e => setFiltroEdadMax(e.target.value)}
                      className="w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Ciudad</label>
                  <input
                    type="text" placeholder="Ej: Buenos Aires"
                    value={filtroCiudad} onChange={e => setFiltroCiudad(e.target.value)}
                    className="w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                  />
                </div>
                {(ofertaSeleccionada?.docs_requeridos?.length ?? 0) > 0 && (
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Documentos</label>
                    <label className="flex items-center gap-2 cursor-pointer py-1.5">
                      <input
                        type="checkbox" checked={filtroDocsCompletos}
                        onChange={e => setFiltroDocsCompletos(e.target.checked)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Solo con docs completos</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap items-center">
              <button onClick={() => setFiltroEstado('todos')}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={filtroEstado === 'todos' ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                Todos ({postulantes.length})
              </button>
              {PIPELINE.map(p => {
                const count = conteosPorEstado[p.estado] || 0;
                if (count === 0) return null;
                return (
                  <button key={p.estado} onClick={() => setFiltroEstado(p.estado)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={filtroEstado === p.estado ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' } : p.chipStyle}>
                    {p.label} ({count})
                  </button>
                );
              })}
              {(hayFiltrosActivos || filtroEstado !== 'todos') && (
                <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {postulanteFiltrados.length} resultado{postulanteFiltrados.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {seleccionados.size > 0 && (
              <div className="sticky top-2 z-10 mb-4 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg" style={{ background: 'rgba(20,20,35,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{seleccionados.size} candidato{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSeleccionados(new Set())} className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</button>
                  <button onClick={() => setCitaModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ background: '#2dd4bf', color: '#0d0d14' }}>
                    <CalendarPlus size={14} /> Agendar cita{seleccionados.size > 1 ? ' grupal' : ''}
                  </button>
                </div>
              </div>
            )}

            {postulanteFiltrados.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>No hay postulantes en este estado</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Header tabla */}
                <div className="hidden md:grid grid-cols-[28px_180px_1fr_auto_160px] gap-4 px-4 py-2 uppercase tracking-wide items-center text-xs font-medium" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  <span />
                  <span>Video CV</span>
                  <span>Candidato</span>
                  <span>Docs</span>
                  <span>Estado</span>
                </div>

                {postulanteFiltrados.map((p, idx) => {
                  const pipelineInfo = getPipelineInfo(p.estado);
                  const Icon = pipelineInfo.icon;
                  const edad = calcularEdad(p.usuario.fecha_nacimiento);
                  const ciudad = p.usuario.direccion?.split(',').slice(-2).join(',').trim() || '';
                  return (
                    <div key={p.id} className="flex md:grid md:grid-cols-[28px_180px_1fr_auto_160px] gap-4 items-center px-4 py-3 transition-colors" style={idx !== postulanteFiltrados.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}>

                      {/* Checkbox selección */}
                      <input
                        type="checkbox"
                        checked={seleccionados.has(p.id)}
                        onChange={() => toggleSeleccionado(p.id)}
                        className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
                      />

                      {/* Thumbnail video */}
                      <div
                        className="relative rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                        style={{ background: '#0d0d14', width: 180, height: 101 }}
                        onClick={() => { setVideoModal(p); if (p.estado === 'pendiente') cambiarEstado(p.id, 'visto'); }}
                      >
                        <video
                          src={p.video.video_url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                          loop
                          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                          onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0 pointer-events-none">
                          <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[12px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={pipelineInfo.chipStyle}>
                            <Icon size={9} />{pipelineInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Info candidato */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{p.usuario.nombre_completo}</h3>
                          {p.usuario.alfa_digital && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                              {p.usuario.alfa_digital === 'Perfil nativo digital' ? '🚀' : p.usuario.alfa_digital === 'Usuario digital activo' ? '⚡' : '🌱'}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {edad && <span>{edad}</span>}
                          {ciudad && <span>📍 {ciudad}</span>}
                        </div>
                        {p.usuario.bio && <p className="text-xs line-clamp-1 mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.usuario.bio}</p>}
                        {/* Habilidades rápidas si tiene CV */}
                        {(p.usuario.cv_datos?.habilidades?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.usuario.cv_datos!.habilidades!.slice(0, 3).map((h, i) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>{h}</span>
                            ))}
                            {(p.usuario.cv_datos!.habilidades!.length ?? 0) > 3 && (
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>+{p.usuario.cv_datos!.habilidades!.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <a href={`/u/${p.usuario.slug}/cv`} target="_blank"
                            className="text-xs px-2 py-1 rounded-lg" style={{ border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}>
                            Ver perfil
                          </a>
                          {ofertaSeleccionada?.mensaje_whatsapp && p.usuario.telefono && (
                            <a href={whatsappUrl(p.usuario.telefono, ofertaSeleccionada.mensaje_whatsapp, p.usuario.nombre_completo)}
                              target="_blank" className="text-xs px-2 py-1 rounded-lg" style={{ background: '#34d399', color: '#0d0d14' }}>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Documentos */}
                      <div className="hidden md:flex flex-col gap-1">
                        {ofertaSeleccionada?.docs_requeridos?.length > 0
                          ? ofertaSeleccionada.docs_requeridos.map(tipo => {
                              const tipoBase = parseDocTipo(tipo);
                              const tieneDoc = p.documentos?.some(d => d.tipo === tipoBase);
                              const doc = p.documentos?.find(d => d.tipo === tipoBase);
                              const label = parseDocLabel(tipo);
                              return (
                                <span key={tipo} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap" style={tieneDoc ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' } : { background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                                  {tieneDoc ? <Check size={9} /> : <X size={9} />}
                                  {tieneDoc && doc ? <a href={doc.file_url} target="_blank" className="hover:underline">{label}</a> : label}
                                </span>
                              );
                            })
                          : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                        }
                      </div>

                      {/* Estado */}
                      <div className="hidden md:block">
                        <select
                          value={p.estado}
                          onChange={e => cambiarEstado(p.id, e.target.value)}
                          className="w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                        >
                          {PIPELINE.map(s => <option key={s.estado} value={s.estado}>{s.label}</option>)}
                        </select>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Citas */}
        {tab === 'citas' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Entrá a una oferta y seleccioná candidatos para agendarles una cita.</p>
              <button onClick={() => setTab('ofertas')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0" style={{ background: '#2dd4bf', color: '#0d0d14' }}>
                <CalendarPlus size={14} /> Nueva cita
              </button>
            </div>
            {citas.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Todavía no agendaste ninguna cita</p>
              </div>
            ) : (
              Object.entries(citasPorDia).map(([dia, items]) => (
                <div key={dia}>
                  <h3 className="text-sm font-semibold mb-2 capitalize" style={{ color: 'rgba(255,255,255,0.8)' }}>{dia}</h3>
                  <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {items.map(c => (
                      <div key={c.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="w-16 flex-shrink-0 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          {new Date(c.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={c.modalidad === 'presencial' ? { background: 'rgba(251,146,60,0.15)', color: '#fb923c' } : { background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                              {c.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                            </span>
                            {c.grupal && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>Grupal</span>}
                            {c.oferta && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.oferta.titulo}</span>}
                          </div>
                          <p className="text-sm mt-1 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.lugar}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.invitados.map(inv => (
                              <span key={inv.id} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={
                                inv.estado === 'confirmada' ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' } :
                                inv.estado === 'rechazada' ? { background: 'rgba(248,113,113,0.15)', color: '#f87171' } : { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
                              }>
                                {inv.postulacion.usuario.nombre_completo}
                                {inv.estado === 'confirmada' && ' ✓'}
                                {inv.estado === 'rechazada' && ' ✕'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Capacitaciones */}
        {tab === 'capacitaciones' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Mis capacitaciones</h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Los candidatos ven tu video y completan una pregunta para ganar una estrella en su perfil.</p>
              </div>
              <button
                onClick={() => setNewCapOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}
              >
                <Plus size={15} /> Nueva capacitación
              </button>
            </div>

            {capMsg && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium" style={capMsg.includes('✓') ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' } : { background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                {capMsg}
              </div>
            )}

            {/* Formulario nueva */}
            {newCapOpen && (
              <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(96,165,250,0.25)' }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}><GraduationCap size={16} style={{ color: '#60a5fa' }} /> Nueva capacitación</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Título *</label>
                    <input value={capForm.titulo} onChange={e => setCapForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Introducción al servicio al cliente" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Descripción (opcional)</label>
                    <textarea value={capForm.descripcion} onChange={e => setCapForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} placeholder="¿De qué trata esta capacitación?" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>URL de YouTube *</label>
                    <input value={capForm.video_url} onChange={e => setCapForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                    {getYouTubeId(capForm.video_url) && (
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(capForm.video_url)}/mqdefault.jpg`} alt="preview" className="mt-2 rounded-lg w-48 object-cover" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Rubro (opcional)</label>
                    <input value={capForm.rubro} onChange={e => setCapForm(f => ({ ...f, rubro: e.target.value }))} placeholder="Ej: Gastronomía" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div className="col-span-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Pregunta de verificación *</label>
                    <input value={capForm.pregunta} onChange={e => setCapForm(f => ({ ...f, pregunta: e.target.value }))} placeholder="Ej: ¿Cuál es la actitud correcta ante un cliente molesto?" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium block" style={{ color: 'rgba(255,255,255,0.6)' }}>Opciones de respuesta * <span className="font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>(marcá la correcta)</span></label>
                    {capForm.opciones.map((op, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => setCapForm(f => ({ ...f, respuesta_correcta: i }))}
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={capForm.respuesta_correcta === i ? { borderColor: '#34d399', background: '#34d399' } : { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
                        >
                          {capForm.respuesta_correcta === i && <Check size={12} style={{ color: '#fff' }} />}
                        </button>
                        <span className="text-xs font-medium w-5" style={{ color: 'rgba(255,255,255,0.5)' }}>{String.fromCharCode(65 + i)}.</span>
                        <input
                          value={op}
                          onChange={e => setCapForm(f => { const o = [...f.opciones]; o[i] = e.target.value; return { ...f, opciones: o }; })}
                          placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                          className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                        />
                      </div>
                    ))}
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>El círculo verde indica la opción correcta.</p>
                  </div>
                </div>
                {capMsg && (
                  <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                    ⚠️ {capMsg}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={crearCapacitacion} disabled={savingCap} className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>
                    {savingCap ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                    Crear capacitación
                  </button>
                  <button onClick={() => setNewCapOpen(false)} className="px-5 py-2 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista */}
            {capacitaciones.length === 0 && !newCapOpen ? (
              <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <GraduationCap size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Todavía no creaste ninguna capacitación</p>
                <button onClick={() => setNewCapOpen(true)} className="px-5 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>Crear primera capacitación</button>
              </div>
            ) : (
              <div className="space-y-3">
                {capacitaciones.map(cap => {
                  const ytId = getYouTubeId(cap.video_url);
                  return (
                    <div key={cap.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {ytId ? (
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={cap.titulo} className="w-28 h-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-28 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <GraduationCap size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{cap.titulo}</h3>
                          {cap.rubro && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>{cap.rubro}</span>}
                          <span className="text-xs px-2 py-0.5 rounded-full" style={cap.activa ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                            {cap.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        {cap.descripcion && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{cap.descripcion}</p>}
                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Star size={11} className="text-amber-400" fill="currentColor" />
                          <span>{cap._count.completadas} {cap._count.completadas === 1 ? 'candidato completó' : 'candidatos completaron'} esta capacitación</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleCapActiva(cap.id, cap.activa)}
                          title={cap.activa ? 'Desactivar' : 'Activar'}
                          className="p-2 rounded-lg transition-colors"
                          style={cap.activa ? { border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' } : { border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                        >
                          {cap.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => eliminarCapacitacion(cap.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Servicios */}
        {tab === 'servicios' && (
          <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Servicios y módulos</h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Publicá servicios, aceptá candidatos y gestioná sus módulos de trabajo.</p>
              </div>
              <button
                onClick={() => { setNewServicioOpen(v => !v); setServicioSeleccionado(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}
              >
                <Plus size={15} /> Nuevo servicio
              </button>
            </div>

            {servicioMsg && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium" style={servicioMsg.startsWith('✓') ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' } : { background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                {servicioMsg}
              </div>
            )}

            {/* Formulario nuevo servicio */}
            {newServicioOpen && (
              <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(45,212,191,0.2)' }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <Layers size={16} style={{ color: '#2dd4bf' }} /> {editandoServicioId ? 'Editar servicio' : 'Nuevo servicio'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Título *</label>
                    <input value={servicioForm.titulo} onChange={e => setServicioForm(p => ({ ...p, titulo: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Ej: Limpieza de oficinas mensual" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Descripción *</label>
                    <textarea value={servicioForm.descripcion} onChange={e => setServicioForm(p => ({ ...p, descripcion: e.target.value }))}
                      rows={3} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Describí qué involucra este servicio..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Frecuencia</label>
                    <select value={servicioForm.frecuencia} onChange={e => setServicioForm(p => ({ ...p, frecuencia: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                      <option value="diaria">Diaria</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                      <option value="unica">Única vez</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Duración de jornada</label>
                    <input value={servicioForm.duracion_jornada} onChange={e => setServicioForm(p => ({ ...p, duracion_jornada: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Ej: 6 hs/día, 4 hs los sábados" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Total hs del módulo</label>
                    <input type="number" min="1" value={servicioForm.horas_modulo} onChange={e => setServicioForm(p => ({ ...p, horas_modulo: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Ej: 40" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Precio por hora ($)</label>
                    <input type="number" min="0" step="0.01" value={servicioForm.precio_hora} onChange={e => setServicioForm(p => ({ ...p, precio_hora: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Ej: 3500" />
                  </div>
                  {servicioForm.horas_modulo && servicioForm.precio_hora && (
                    <div className="col-span-2 rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-2" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
                      <span>Honorario estimado por módulo:</span>
                      <span>${(parseFloat(servicioForm.horas_modulo) * parseFloat(servicioForm.precio_hora)).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Deadline (opcional)</label>
                    <input type="date" value={servicioForm.deadline} onChange={e => setServicioForm(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  {capacitaciones.length > 0 && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Capacitación requerida (opcional)</label>
                      <select value={servicioForm.capacitacion_id} onChange={e => setServicioForm(p => ({ ...p, capacitacion_id: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                        <option value="">Sin capacitación requerida</option>
                        {capacitaciones.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Modelo de contrato / acuerdo (opcional)</label>
                      <button
                        type="button"
                        onClick={() => setServicioForm(p => ({ ...p, contrato_template: CONTRATO_PLANTILLA(p.titulo || '[NOMBRE DEL SERVICIO]') }))}
                        className="text-xs hover:underline flex items-center gap-1"
                        style={{ color: '#2dd4bf' }}
                      >
                        <FileText size={11} /> Usar plantilla de referencia
                      </button>
                    </div>
                    <textarea value={servicioForm.contrato_template} onChange={e => setServicioForm(p => ({ ...p, contrato_template: e.target.value }))}
                      rows={8} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                      placeholder="Texto base del acuerdo entre las partes..." />
                    {servicioForm.contrato_template && (
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Editá el texto reemplazando los campos entre [corchetes] con los datos reales.</p>
                    )}
                  </div>
                </div>
                {/* Documentos requeridos */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Documentos requeridos al prestador</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCS_CONFIG.map(doc => (
                      <div key={doc.tipo}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={servicioForm.docs_requeridos.some(d => parseDocTipo(d) === doc.tipo)}
                            onChange={() => toggleDocServicio(doc.tipo)}
                            className="w-4 h-4 accent-teal-600 flex-shrink-0" />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{doc.label}</span>
                        </label>
                        {doc.tipo === 'otro' && servicioForm.docs_requeridos.some(d => parseDocTipo(d) === 'otro') && (
                          <input
                            value={otroLabelServicio}
                            onChange={e => {
                              setOtroLabelServicio(e.target.value);
                              setServicioForm(p => ({
                                ...p,
                                docs_requeridos: [
                                  ...p.docs_requeridos.filter(d => parseDocTipo(d) !== 'otro'),
                                  e.target.value.trim() ? `otro:${e.target.value}` : 'otro',
                                ],
                              }));
                            }}
                            placeholder="Nombre del documento"
                            className="mt-1 ml-6 w-full rounded-lg px-2 py-1 text-xs focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Protocolo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Protocolo de trabajo *</label>
                    <button onClick={() => setServicioForm(p => ({ ...p, protocolo: [...p.protocolo, { ...PROTOCOLO_ITEM_EMPTY }] }))}
                      className="text-xs hover:underline flex items-center gap-1" style={{ color: '#2dd4bf' }}>
                      <Plus size={12} /> Agregar item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {servicioForm.protocolo.map((pi, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-xs mt-2 w-5 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{idx + 1}.</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input value={pi.item} onChange={e => setServicioForm(p => { const pr = [...p.protocolo]; pr[idx] = { ...pr[idx], item: e.target.value }; return { ...p, protocolo: pr }; })}
                            className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                            placeholder="Item *" />
                          <input value={pi.descripcion} onChange={e => setServicioForm(p => { const pr = [...p.protocolo]; pr[idx] = { ...pr[idx], descripcion: e.target.value }; return { ...p, protocolo: pr }; })}
                            className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                            placeholder="Descripción (opcional)" />
                        </div>
                        {servicioForm.protocolo.length > 1 && (
                          <button onClick={() => setServicioForm(p => ({ ...p, protocolo: p.protocolo.filter((_, i) => i !== idx) }))}
                            className="p-2 flex-shrink-0" style={{ color: '#f87171' }}><X size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={crearServicio} disabled={savingServicio}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                    {savingServicio ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {editandoServicioId ? 'Guardar cambios' : 'Crear servicio'}
                  </button>
                  <button onClick={() => { setNewServicioOpen(false); setEditandoServicioId(null); setServicioForm({ titulo: '', descripcion: '', frecuencia: 'mensual', duracion_jornada: '', horas_modulo: '', precio_hora: '', deadline: '', capacitacion_id: '', contrato_template: '', docs_requeridos: [], protocolo: [{ ...PROTOCOLO_ITEM_EMPTY }] }); }}
                    className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista de servicios */}
            {!servicioSeleccionado && (
              <div className="space-y-3">
                {serviciosEmpresa.length === 0 && !newServicioOpen && (
                  <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                    <Layers size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Todavía no creaste ningún servicio.</p>
                    <button onClick={() => setNewServicioOpen(true)} className="mt-3 text-sm hover:underline" style={{ color: '#2dd4bf' }}>Crear el primero</button>
                  </div>
                )}
                {serviciosEmpresa.map(s => (
                  <div key={s.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{s.titulo}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={s.estado === 'activo' ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                            {s.estado === 'activo' ? 'Activo' : 'Cerrado'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
                            {s.frecuencia === 'diaria' ? 'Diaria' : s.frecuencia === 'semanal' ? 'Semanal' : s.frecuencia === 'mensual' ? 'Mensual' : 'Única'}
                          </span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.descripcion}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {s.duracion_jornada && <span className="font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>{s.duracion_jornada}</span>}
                          {s.horas_modulo && <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.horas_modulo} hs/módulo</span>}
                          {s.precio_hora && <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>${Number(s.precio_hora).toLocaleString('es-AR')}/hs</span>}
                          {s.horas_modulo && s.precio_hora && (
                            <span className="font-bold" style={{ color: '#2dd4bf' }}>${(s.horas_modulo * Number(s.precio_hora)).toLocaleString('es-AR', { minimumFractionDigits: 0 })} total</span>
                          )}
                          <span>{s._count.postulaciones} postulantes</span>
                          <span>{s._count.modulos_asignados} módulos activos</span>
                          {s.deadline && <span>Deadline: {new Date(s.deadline).toLocaleDateString('es-AR')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => editarServicio(s)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          style={{ border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf' }}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => { verPostulantesServicio(s); }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}
                        >
                          <Users size={12} /> Gestionar
                        </button>
                        {s.estado === 'activo' && (
                          <button onClick={() => cerrarServicio(s.id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                            Cerrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista detalle de un servicio */}
            {servicioSeleccionado && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setServicioSeleccionado(null); setPostulantesServicio([]); }}
                    className="text-sm hover:underline flex items-center gap-1" style={{ color: '#2dd4bf' }}>
                    ← Volver
                  </button>
                  <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{servicioSeleccionado.titulo}</h3>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 rounded-lg p-1 w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <button onClick={() => setVistaServicio('postulantes')}
                    className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                    style={vistaServicio === 'postulantes' ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' } : { color: 'rgba(255,255,255,0.5)' }}>
                    Postulantes
                    {postulantesServicio.length > 0 && (
                      <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>{postulantesServicio.length}</span>
                    )}
                  </button>
                  <button onClick={() => { setVistaServicio('modulos'); }}
                    className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                    style={vistaServicio === 'modulos' ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' } : { color: 'rgba(255,255,255,0.5)' }}>
                    Módulos activos
                    {modulosServicio.length > 0 && (
                      <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: 'rgba(45,212,191,0.2)', color: '#2dd4bf' }}>{modulosServicio.length}</span>
                    )}
                  </button>
                </div>

                {/* Vista Postulantes */}
                {vistaServicio === 'postulantes' && (
                  <div className="space-y-3">
                    {loadingPostulantesServ && (
                      <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}><Loader2 size={20} className="animate-spin mx-auto" /></div>
                    )}
                    {!loadingPostulantesServ && postulantesServicio.length === 0 && (
                      <div className="rounded-xl p-8 text-center text-sm" style={{ border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        No hay postulantes todavía
                      </div>
                    )}
                    {postulantesServicio.map(p => (
                      <div key={p.id} className="rounded-xl p-4" style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${p.estado === 'aceptado' ? 'rgba(52,211,153,0.3)' : p.estado === 'rechazado' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {p.usuario.foto_url ? (
                              <img src={p.usuario.foto_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>
                                {p.usuario.nombre_completo[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{p.usuario.nombre_completo}</p>
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.usuario.email} · {p.usuario.telefono}</p>
                              {p.usuario.cv_datos?.resumen && (
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.usuario.cv_datos.resumen}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.usuario.videos.length > 0 && (
                              <a href={p.usuario.videos[0].video_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs px-2 py-1.5 rounded-lg flex items-center gap-1"
                                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                <PlayCircle size={12} /> Video
                              </a>
                            )}
                            <a href={`/u/${p.usuario.slug}/cv`} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2 py-1.5 rounded-lg flex items-center gap-1"
                              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                              <ExternalLink size={12} /> Perfil
                            </a>
                            {p.estado === 'pendiente' && (
                              <>
                                {aceptandoConHoras === p.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="Hs totales"
                                      value={horasInput[p.id] ?? ''}
                                      onChange={e => setHorasInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      className="w-24 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                                    />
                                    <button
                                      onClick={() => procesarPostulanteServicio(p.id, 'aceptado', horasInput[p.id] ? parseInt(horasInput[p.id]) : undefined)}
                                      disabled={procesandoPostServ === p.id}
                                      className="text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
                                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                                      {procesandoPostServ === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} OK
                                    </button>
                                    <button onClick={() => setAceptandoConHoras(null)} className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setAceptandoConHoras(p.id)}
                                    disabled={procesandoPostServ === p.id}
                                    className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
                                    style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                                    <Check size={12} /> Aceptar
                                  </button>
                                )}
                                <button onClick={() => procesarPostulanteServicio(p.id, 'rechazado')}
                                  disabled={procesandoPostServ === p.id}
                                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
                                  style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                                  <X size={12} /> Rechazar
                                </button>
                              </>
                            )}
                            {p.estado === 'aceptado' && (
                              <>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                                  Aceptado
                                </span>
                                <button
                                  onClick={() => { setVistaServicio('modulos'); }}
                                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                                  style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                                  <Layers size={12} /> Ver módulo
                                </button>
                              </>
                            )}
                            {p.estado === 'rechazado' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                                Rechazado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vista Módulos */}
                {vistaServicio === 'modulos' && (
                  <div className="space-y-3">
                    {loadingModulos && <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}><Loader2 size={20} className="animate-spin mx-auto" /></div>}
                    {!loadingModulos && modulosServicio.length === 0 && (
                      <div className="rounded-xl p-8 text-center text-sm" style={{ border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                        No hay módulos asignados todavía. Aceptá candidatos desde la vista de Postulantes.
                      </div>
                    )}
                    {modulosServicio.map(mod => (
                      <ModuloEmpresaCard
                        key={mod.id}
                        modulo={mod}
                        onGenerarRemito={generarRemito}
                        onCambiarEstado={cambiarEstadoModulo}
                        onAprobarItem={aprobarItemEvidencia}
                        generandoRemito={generandoRemito}
                        remitoMsg={remitoMsg}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Perfil */}
        {tab === 'perfil' && (
          <div className="space-y-5 max-w-xl">
            {/* Card página pública */}
            {empresa?.slug && (
              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <Globe size={15} style={{ color: '#2dd4bf' }} /> Página pública de tu empresa
                </h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Esta es la página que podés compartir con candidatos. Mostrá todas tus ofertas activas y el perfil de tu empresa.
                </p>
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-mono flex-1 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {appUrl.replace(/https?:\/\//, '')}/empresa/{empresa.slug}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/empresa/${empresa.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <ExternalLink size={12} /> Ver página
                  </a>
                  <button
                    onClick={copiarLink}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf' }}
                  >
                    <Copy size={12} /> {linkCopiado ? '¡Copiado!' : 'Copiar link'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText(empresa.nombre, `${appUrl}/empresa/${empresa.slug}`))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Compartir por WhatsApp
                  </a>
                </div>
              </div>
            )}

          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Perfil de empresa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Logo</label>
                <div className="flex items-center gap-4">
                  {empresa?.logo_url ? <img src={empresa.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} /> : <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>🏢</div>}
                  <label className="px-4 py-2 rounded-lg text-sm cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    Subir logo
                    <input type="file" accept="image/*" className="hidden" onChange={subirLogo} />
                  </label>
                </div>
              </div>

              {/* Galería de fotos */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Fotos de la empresa
                  <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>(aparecen como fondo en tus ofertas)</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(empresa?.imagenes ?? []).map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => eliminarImagenEmpresa(url)}
                        className="absolute inset-0 bg-black/50 text-white text-lg font-bold hidden group-hover:flex items-center justify-center transition-opacity"
                      >×</button>
                    </div>
                  ))}
                  <label className={`w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${subiendoImagen ? 'opacity-50' : ''}`}
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                    <input type="file" accept="image/*" className="hidden" disabled={subiendoImagen} onChange={subirImagenEmpresa} />
                    <span className="text-2xl leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>+</span>
                    <span className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{subiendoImagen ? 'Subiendo…' : 'Agregar'}</span>
                  </label>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Fotos reales del local, equipo o productos. La primera foto se muestra en las páginas de oferta.</p>
              </div>

              {/* Fuente */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Tipografía
                  <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>(se aplica en tu landing y ofertas)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.entries(FONT_OPTIONS) as [FontKey, typeof FONT_OPTIONS[FontKey]][]).map(([key, font]) => {
                    const isActive = (empresa?.fuente ?? 'plus-jakarta') === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={async () => {
                          setEmpresa(prev => prev ? { ...prev, fuente: key } : prev);
                          await fetch('/api/empresa/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fuente: key }) });
                        }}
                        className="px-3 py-2.5 rounded-lg text-left transition-all"
                        style={isActive ? { border: '2px solid #7048F0', background: 'rgba(112,72,240,0.1)' } : { border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                      >
                        <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Aa</p>
                        <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: font.family }}>{font.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color de marca */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Color de marca
                  <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>(botones y textos en tus ofertas)</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {['#16a34a','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#ea580c','#111827'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={async () => {
                        setEmpresa(prev => prev ? { ...prev, color_primario: c } : prev);
                        await fetch('/api/empresa/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color_primario: c }) });
                      }}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: c,
                        borderColor: empresa?.color_primario === c ? '#111' : 'transparent',
                        boxShadow: empresa?.color_primario === c ? '0 0 0 2px #fff, 0 0 0 4px #111' : 'none',
                      }}
                      title={c}
                    />
                  ))}
                  {/* Custom color input */}
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={empresa?.color_primario ?? '#16a34a'}
                      className="sr-only"
                      onChange={async e => {
                        const c = e.target.value;
                        setEmpresa(prev => prev ? { ...prev, color_primario: c } : prev);
                        await fetch('/api/empresa/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color_primario: c }) });
                      }}
                    />
                    <div className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center text-xs font-bold" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }}>+</div>
                  </label>
                  {empresa?.color_primario && (
                    <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{empresa.color_primario}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Nombre *</label>
                <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Descripción</label>
                <textarea value={perfilForm.descripcion} onChange={e => setPerfilForm({ ...perfilForm, descripcion: e.target.value })} rows={3} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Mensaje de bienvenida <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>(aparece en todas tus páginas de oferta)</span>
                </label>
                <input
                  value={perfilForm.mensaje_bienvenida}
                  onChange={e => setPerfilForm({ ...perfilForm, mensaje_bienvenida: e.target.value })}
                  placeholder="Ej: TE ESTAMOS BUSCANDO, QUEREMOS CONOCERTE"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Si lo dejás vacío, se muestra "TE ESTAMOS BUSCANDO".</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Rubro</label>
                  <input value={perfilForm.rubro} onChange={e => setPerfilForm({ ...perfilForm, rubro: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Ciudad</label>
                  <input value={perfilForm.ciudad} onChange={e => setPerfilForm({ ...perfilForm, ciudad: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Sitio web</label>
                <input value={perfilForm.sitio_web} onChange={e => setPerfilForm({ ...perfilForm, sitio_web: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <button onClick={guardarPerfil} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }}>
                {perfilGuardado ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Modal agendar cita */}
      {citaModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={cerrarCitaModal}>
          <div className="rounded-2xl max-w-md w-full p-6" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            {!citaResultado ? (
              <>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Agendar cita{seleccionados.size > 1 ? ' grupal' : ''}</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{seleccionados.size} candidato{seleccionados.size !== 1 ? 's' : ''} invitado{seleccionados.size !== 1 ? 's' : ''}. Se les avisará por email y te damos un link de WhatsApp para confirmar.</p>
                {citaError && <div className="text-sm rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{citaError}</div>}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Fecha</label>
                      <input type="date" value={citaForm.fecha} onChange={e => setCitaForm({ ...citaForm, fecha: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Hora</label>
                      <input type="time" value={citaForm.hora} onChange={e => setCitaForm({ ...citaForm, hora: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Modalidad</label>
                    <div className="flex gap-2">
                      <button onClick={() => setCitaForm({ ...citaForm, modalidad: 'virtual' })} className="flex-1 px-3 py-2 rounded-lg text-sm" style={citaForm.modalidad === 'virtual' ? { background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.4)', color: '#2dd4bf' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Virtual</button>
                      <button onClick={() => setCitaForm({ ...citaForm, modalidad: 'presencial' })} className="flex-1 px-3 py-2 rounded-lg text-sm" style={citaForm.modalidad === 'presencial' ? { background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.4)', color: '#2dd4bf' } : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Presencial</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{citaForm.modalidad === 'presencial' ? 'Dirección' : 'Link de videollamada'}</label>
                    <input value={citaForm.lugar} onChange={e => setCitaForm({ ...citaForm, lugar: e.target.value })} placeholder={citaForm.modalidad === 'presencial' ? 'Av. Siempre Viva 123, CABA' : 'https://meet.google.com/...'} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Mensaje (opcional)</label>
                    <textarea value={citaForm.mensaje} onChange={e => setCitaForm({ ...citaForm, mensaje: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={enviarCita} disabled={citaEnviando} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                    {citaEnviando ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                    Enviar invitación
                  </button>
                  <button onClick={cerrarCitaModal} className="px-4 py-2.5 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}><Check size={18} style={{ color: '#34d399' }} /> Cita agendada</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Le mandamos un email a cada candidato. También podés enviarles el aviso por WhatsApp:</p>
                <div className="space-y-2 mb-4">
                  {citaResultado.map(w => (
                    <a key={w.url} href={w.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                      <span>{w.candidato}</span>
                      <span className="text-xs font-medium">Enviar WhatsApp →</span>
                    </a>
                  ))}
                </div>
                <button onClick={cerrarCitaModal} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>Listo</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal video */}
      {videoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
          <div className="rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{videoModal.usuario.nombre_completo}</h3>
                  {videoModal.usuario.alfa_digital && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                      {videoModal.usuario.alfa_digital === 'Perfil nativo digital' ? '🚀' : videoModal.usuario.alfa_digital === 'Usuario digital activo' ? '⚡' : '🌱'} {videoModal.usuario.alfa_digital}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span>{videoModal.usuario.email}</span>
                  {calcularEdad(videoModal.usuario.fecha_nacimiento) && <span>· {calcularEdad(videoModal.usuario.fecha_nacimiento)}</span>}
                </div>
              </div>
              <button onClick={() => setVideoModal(null)} className="text-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>

            {/* Video CV genérico */}
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Video CV</p>
            <video src={videoModal.video.video_url} controls className="w-full rounded-xl mb-3" />

            {/* Intentos por sección */}
            {videoModal.video.section_attempts && videoModal.video.section_attempts.length > 0 && (
              <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Intentos por sección</p>
                <div className="space-y-1.5">
                  {videoModal.video.section_attempts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.nombre}</span>
                      <span className="font-semibold tabular-nums" style={{ color: s.intentos === 1 ? '#34d399' : s.intentos === 2 ? '#fbbf24' : '#f87171' }}>
                        {s.intentos} {s.intentos === 1 ? 'intento' : 'intentos'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video específico (respuestas a preguntas) */}
            {videoModal.usuario.videos?.[0] && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#a78bfa' }}>Respuestas a tus preguntas</p>
                <video src={videoModal.usuario.videos[0].video_url} controls className="w-full rounded-xl" />
              </div>
            )}

            {/* Bio */}
            {videoModal.usuario.bio && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Sobre el candidato</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{videoModal.usuario.bio}</p>
              </div>
            )}

            {/* Capacitaciones completadas */}
            {(videoModal.usuario.capacitaciones_ok?.length ?? 0) > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
                  <GraduationCap size={13} /> Capacitaciones completadas
                </p>
                <div className="space-y-1.5">
                  {videoModal.usuario.capacitaciones_ok!.map((c, i) => (
                    <div key={i} className="flex items-start justify-between text-xs">
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.capacitacion.titulo}</span>
                      <span className="shrink-0 ml-2" style={{ color: '#fbbf24' }}>{c.capacitacion.empresa.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referencias verificadas */}
            {(videoModal.usuario.referencias?.length ?? 0) > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
                  <Star size={13} /> Referencias verificadas
                </p>
                <div className="space-y-3">
                  {videoModal.usuario.referencias!.map((r) => (
                    <div key={r.id} className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      <p className="font-semibold">{r.referidor_nombre}{r.referidor_cargo ? ` · ${r.referidor_cargo}` : ''}</p>
                      <p style={{ color: '#60a5fa' }}>{r.empresa_nombre}</p>
                      {r.mensaje && <p className="mt-0.5 italic" style={{ color: 'rgba(255,255,255,0.6)' }}>"{r.mensaje}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CV del candidato */}
            <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>CV del candidato</p>
                {videoModal.usuario.cv_datos ? (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>✓ CV cargado</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>Sin CV</span>
                )}
              </div>
              {!videoModal.usuario.cv_datos ? (
                <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.4)' }}>Este candidato aún no cargó su CV en la plataforma.</p>
              ) : (
                <>
                  {videoModal.usuario.cv_datos.resumen && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{videoModal.usuario.cv_datos.resumen}</p>
                  )}
                  {(videoModal.usuario.cv_datos.experiencia?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Experiencia</p>
                      <div className="space-y-1.5">
                        {videoModal.usuario.cv_datos.experiencia!.map((e, i) => (
                          <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                            <span className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{e.cargo}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}> — {e.empresa}</span>
                            {e.periodo && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {e.periodo}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(videoModal.usuario.cv_datos.educacion?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Educación</p>
                      <div className="space-y-1.5">
                        {videoModal.usuario.cv_datos.educacion!.map((e, i) => (
                          <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                            <span className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{e.titulo}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}> — {e.institucion}</span>
                            {e.periodo && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {e.periodo}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(videoModal.usuario.cv_datos.habilidades?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {videoModal.usuario.cv_datos.habilidades!.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>{h}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bio */}
            {videoModal.usuario.bio && (
              <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Bio</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{videoModal.usuario.bio}</p>
              </div>
            )}

            {/* Capacitaciones completadas */}
            {(videoModal.usuario.capacitaciones_ok?.length ?? 0) > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: '#fbbf24' }}>
                  <GraduationCap size={12} /> Capacitaciones completadas ({videoModal.usuario.capacitaciones_ok!.length})
                </p>
                <div className="space-y-1.5">
                  {videoModal.usuario.capacitaciones_ok!.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.capacitacion.titulo}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.capacitacion.empresa.nombre}</p>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#fbbf24' }}>
                        {new Date(c.completada_en).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referencias laborales verificadas */}
            {(videoModal.usuario.referencias?.length ?? 0) > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Star size={12} className="text-amber-500" fill="currentColor" /> Referencias verificadas ({videoModal.usuario.referencias!.length})
                </p>
                <div className="space-y-2">
                  {videoModal.usuario.referencias!.map((r, i) => (
                    <div key={i} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.referidor_nombre}</span>
                        {r.referidor_cargo && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· {r.referidor_cargo}</span>}
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>en {r.empresa_nombre}</span>
                      </div>
                      {r.mensaje && <p className="text-xs mt-1 italic" style={{ color: 'rgba(255,255,255,0.6)' }}>"{r.mensaje}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos */}
            {(videoModal.documentos?.length ?? 0) > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Documentos</p>
                <div className="flex flex-wrap gap-2">
                  {videoModal.documentos!.map(doc => {
                    const label = DOCS_CONFIG.find(c => c.tipo === doc.tipo)?.label || doc.tipo;
                    return (
                      <a key={doc.tipo} href={doc.file_url} target="_blank"
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                        <Check size={10} /> {label}
                      </a>
                    );
                  })}
                  {ofertaSeleccionada?.docs_requeridos?.filter(tipo => !videoModal.documentos?.some(d => d.tipo === parseDocTipo(tipo))).map(tipo => {
                    const label = parseDocLabel(tipo);
                    return (
                      <span key={tipo} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                        <X size={10} /> {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <a href={`/u/${videoModal.usuario.slug}/cv`} target="_blank"
                className="flex-1 text-center py-2 rounded-lg text-sm"
                style={{ border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}>Ver perfil →</a>
              {ofertaSeleccionada?.mensaje_whatsapp && (
                <a href={whatsappUrl(videoModal.usuario.telefono, ofertaSeleccionada.mensaje_whatsapp, videoModal.usuario.nombre_completo)}
                  target="_blank" className="flex-1 text-center py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                  📱 WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
