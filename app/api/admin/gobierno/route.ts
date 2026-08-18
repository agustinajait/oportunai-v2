/**
 * GET /api/admin/gobierno
 * Datos agregados de inteligencia del mercado laboral — dashboard de gobierno.
 * Solo admin y super_admin.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;
type Dim = typeof DIMS[number];
type Color = 'verde' | 'amarillo' | 'rojo';

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/** Normaliza el título educativo a un nivel legible */
function normalizarNivelEstudios(titulo: string): string {
  const t = titulo.toLowerCase();
  if (t.includes('doctor') || t.includes('phd'))               return 'Doctorado';
  if (t.includes('maestr') || t.includes('master') || t.includes('mba')) return 'Maestría';
  if (t.includes('univers') || t.includes('licenci') || t.includes('ingenier') || t.includes('abog') || t.includes('contador')) return 'Universitario';
  if (t.includes('tecnic') || t.includes('tecnolo') || t.includes('terciario')) return 'Terciario / Técnico';
  if (t.includes('bachiller') || t.includes('secundar') || t.includes('polimodal')) return 'Secundario';
  if (t.includes('primar')) return 'Primario';
  if (t.includes('curso') || t.includes('taller') || t.includes('capacitac')) return 'Cursos / Capacitaciones';
  return 'Otro';
}

/** Extrae el rubro / sector de un cargo */
function normalizarRubro(cargo: string): string {
  const c = cargo.toLowerCase();
  if (c.includes('cociner') || c.includes('gastrono') || c.includes('mozo') || c.includes('barman') || c.includes('kitchen')) return 'Gastronomía';
  if (c.includes('seguridad') || c.includes('vigilancia') || c.includes('portero'))    return 'Seguridad';
  if (c.includes('limpieza') || c.includes('limpiador') || c.includes('mucama'))       return 'Limpieza / Doméstico';
  if (c.includes('construct') || c.includes('albañil') || c.includes('plomer') || c.includes('electri') || c.includes('pintor') || c.includes('carpinter')) return 'Construcción / Oficios';
  if (c.includes('ventas') || c.includes('vendedor') || c.includes('comercial') || c.includes('atención al cliente')) return 'Ventas / Comercial';
  if (c.includes('logística') || c.includes('cadete') || c.includes('delivery') || c.includes('chofer') || c.includes('transport')) return 'Logística / Transporte';
  if (c.includes('admin') || c.includes('secretar') || c.includes('recepcion'))        return 'Administración';
  if (c.includes('cuidado') || c.includes('enferm') || c.includes('salud') || c.includes('médic')) return 'Salud / Cuidado';
  if (c.includes('docente') || c.includes('profe') || c.includes('maestro') || c.includes('capacitador')) return 'Educación';
  if (c.includes('sistem') || c.includes('programad') || c.includes('developer') || c.includes('tecnol') || c.includes('it ')) return 'Tecnología / IT';
  if (c.includes('diseño') || c.includes('designer') || c.includes('creativ'))         return 'Diseño / Creatividad';
  if (c.includes('agro') || c.includes('campo') || c.includes('rural'))                return 'Agro / Campo';
  if (c.includes('industri') || c.includes('manufactur') || c.includes('operario'))    return 'Industria / Manufactura';
  return 'Otros oficios';
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Traemos TODO de una vez para evitar el bug de Prisma con JSON nullable
  const todosLosUsuarios = await prisma.usuario.findMany({
    where: { role: 'user' },
    select: {
      id: true,
      korai_semaforo: true,
      cv_datos: true,
      alfa_digital: true,
      alfa_score: true,
      whatsapp_activo: true,
      korai_opt_in: true,
      created_at: true,
      fecha_nacimiento: true,
      _count: {
        select: {
          videos: { where: { tipo: 'video_cv', es_fragmento: false } },
          postulaciones: true,
          capacitaciones_ok: true,
          taller_usuarios: { where: { estado: { in: ['completado', 'validado'] } } },
          modulos_asignados: true,
          referencias: true,
        },
      },
    },
  });

  const totalUsuarios   = todosLosUsuarios.length;
  const usuariosWA      = todosLosUsuarios.filter(u => u.whatsapp_activo).length;
  const usuariosRaw     = todosLosUsuarios.filter(u => u.korai_semaforo !== null);
  const usuariosConDiag = usuariosRaw.length;

  // ── Semáforo Korai ─────────────────────────────────────
  const porDimension: Record<Dim, { verde: number; amarillo: number; rojo: number; sin_dato: number }> = {
    empleo:    { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    educacion: { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    ingresos:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    salud:     { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    vivienda:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    red:       { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
  };
  let estadoCritico = 0, estadoAlerta = 0, estadoEstable = 0;
  const situacionLaboral: Record<string, number> = {};
  const ingresoHogar:     Record<string, number> = {};
  const tipoVivienda:     Record<string, number> = {};
  const barriosMap: Record<string, { total: number; rojo: number; amarillo: number; habilidades: string[]; rubros: string[] }> = {};
  const voces: { barrio: string; texto: string; fecha: string }[] = [];

  // ── Perfil formativo (cv_datos) ────────────────────────
  const nivelesEstudios: Record<string, number> = {};
  const rubrosExperiencia: Record<string, number> = {};
  const habilidadesMap: Record<string, number> = {};
  const idiomasMap: Record<string, number> = {};
  const experienciaAnios: number[] = [];

  // ── Alfabetización digital ─────────────────────────────
  const alfaByNivel: Record<string, number> = {
    'Básico': 0, 'Intermedio': 0, 'Avanzado': 0, 'Sin dato': 0,
  };
  let alfaScoreSum = 0, alfaScoreCount = 0;

  // ── Actividad en plataforma ────────────────────────────
  let conVideoCV = 0, sinVideoCV = 0;
  let conCapacitacion = 0, sinCapacitacion = 0;
  let conTaller = 0;
  let conModulo = 0;
  let conPostulacion = 0;
  let conReferencia = 0;
  let totalCapacitaciones = 0;
  let totalPostulaciones = 0;
  let totalModulos = 0;

  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);
  let registradosUltimos30 = 0;

  for (const u of todosLosUsuarios) {
    if (new Date(u.created_at) >= hace30) registradosUltimos30++;

    // — Semáforo Korai
    const sem = u.korai_semaforo as Record<string, unknown> | null;
    const barrio = (sem?.barrio as string | undefined) ?? '';

    if (sem) {
      let tieneRojo = false, tieneAmarillo = false;
      for (const dim of DIMS) {
        const color = sem[dim] as Color | undefined;
        if (color === 'verde' || color === 'amarillo' || color === 'rojo') {
          porDimension[dim][color]++;
          if (color === 'rojo') tieneRojo = true;
          if (color === 'amarillo') tieneAmarillo = true;
        } else {
          porDimension[dim].sin_dato++;
        }
      }
      if (tieneRojo) estadoCritico++;
      else if (tieneAmarillo) estadoAlerta++;
      else estadoEstable++;

      const sl = sem.situacion_laboral as string | undefined;
      if (sl) situacionLaboral[sl] = (situacionLaboral[sl] ?? 0) + 1;
      const ih = sem.ingreso_hogar as string | undefined;
      if (ih) ingresoHogar[ih] = (ingresoHogar[ih] ?? 0) + 1;
      const tv = sem.tipo_vivienda as string | undefined;
      if (tv) tipoVivienda[tv] = (tipoVivienda[tv] ?? 0) + 1;

      const motivo = sem.motivo as string | undefined;
      if (motivo?.trim()) {
        voces.push({
          barrio: barrio || 'Sin barrio',
          texto: motivo.trim(),
          fecha: (sem.ultima_actualizacion as string | undefined) ?? new Date(u.created_at).toISOString(),
        });
      }
    }

    // — CV datos
    const cv = u.cv_datos as {
      experiencia?: { cargo?: string; empresa?: string; periodo?: string }[];
      educacion?:   { titulo?: string; institucion?: string; periodo?: string }[];
      habilidades?: string[];
      idiomas?:     string[];
    } | null;

    const userHabilidades: string[] = [];
    const userRubros: string[] = [];

    if (cv) {
      // Educación → nivel más alto
      if (cv.educacion?.length) {
        const nivel = normalizarNivelEstudios(cv.educacion[cv.educacion.length - 1]?.titulo ?? '');
        nivelesEstudios[nivel] = (nivelesEstudios[nivel] ?? 0) + 1;
      }

      // Experiencia → rubros + años
      for (const exp of cv.experiencia ?? []) {
        if (exp.cargo) {
          const rubro = normalizarRubro(exp.cargo);
          rubrosExperiencia[rubro] = (rubrosExperiencia[rubro] ?? 0) + 1;
          userRubros.push(rubro);
        }
        // Calcular años de experiencia aprox desde periodo "2018-2022" o "2020 - actual"
        if (exp.periodo) {
          const nums = exp.periodo.match(/\d{4}/g);
          if (nums && nums.length >= 2) {
            const start = parseInt(nums[0]);
            const end   = parseInt(nums[1]) > 2000 ? parseInt(nums[1]) : new Date().getFullYear();
            if (end > start && end - start < 50) experienciaAnios.push(end - start);
          } else if (nums?.length === 1 && exp.periodo.toLowerCase().includes('actual')) {
            const start = parseInt(nums[0]);
            experienciaAnios.push(new Date().getFullYear() - start);
          }
        }
      }

      // Habilidades
      for (const h of cv.habilidades ?? []) {
        if (h?.trim()) {
          const key = h.trim();
          habilidadesMap[key] = (habilidadesMap[key] ?? 0) + 1;
          userHabilidades.push(key);
        }
      }

      // Idiomas
      for (const i of cv.idiomas ?? []) {
        if (i?.trim()) idiomasMap[i.trim()] = (idiomasMap[i.trim()] ?? 0) + 1;
      }
    }

    // — Barrio (por habilidades y rubros)
    if (barrio) {
      if (!barriosMap[barrio]) barriosMap[barrio] = { total: 0, rojo: 0, amarillo: 0, habilidades: [], rubros: [] };
      barriosMap[barrio].total++;
      if (sem) {
        const colors = DIMS.map(d => (sem[d] as string | undefined));
        if (colors.includes('rojo')) barriosMap[barrio].rojo++;
        else if (colors.includes('amarillo')) barriosMap[barrio].amarillo++;
      }
      barriosMap[barrio].habilidades.push(...userHabilidades);
      barriosMap[barrio].rubros.push(...userRubros);
    }

    // — Alfabetización digital
    if (u.alfa_digital) {
      const nivel = u.alfa_digital === 'basico' ? 'Básico'
        : u.alfa_digital === 'intermedio' ? 'Intermedio'
        : u.alfa_digital === 'avanzado'   ? 'Avanzado'
        : 'Sin dato';
      alfaByNivel[nivel]++;
    } else {
      alfaByNivel['Sin dato']++;
    }
    if (u.alfa_score !== null && u.alfa_score !== undefined) {
      alfaScoreSum += u.alfa_score;
      alfaScoreCount++;
    }

    // — Actividad
    const cnt = u._count;
    if (cnt.videos > 0)           conVideoCV++;           else sinVideoCV++;
    if (cnt.capacitaciones_ok > 0) conCapacitacion++;     else sinCapacitacion++;
    if (cnt.taller_usuarios > 0)  conTaller++;
    if (cnt.modulos_asignados > 0) conModulo++;
    if (cnt.postulaciones > 0)    conPostulacion++;
    if (cnt.referencias > 0)      conReferencia++;
    totalCapacitaciones += cnt.capacitaciones_ok;
    totalPostulaciones  += cnt.postulaciones;
    totalModulos        += cnt.modulos_asignados;
  }

  // ── Rankings ──────────────────────────────────────────
  const rankingCriticidad = DIMS.map(dim => {
    const d = porDimension[dim];
    const total = d.verde + d.amarillo + d.rojo;
    return { dim, rojo: d.rojo, amarillo: d.amarillo, verde: d.verde, total,
      pct_rojo: pct(d.rojo, total), pct_amarillo: pct(d.amarillo, total), pct_verde: pct(d.verde, total) };
  }).sort((a, b) => b.pct_rojo - a.pct_rojo);

  const topHabilidades = Object.entries(habilidadesMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([nombre, total]) => ({ nombre, total }));

  const topRubros = Object.entries(rubrosExperiencia)
    .sort((a, b) => b[1] - a[1])
    .map(([rubro, total]) => ({ rubro, total }));

  const topIdiomas = Object.entries(idiomasMap)
    .sort((a, b) => b[1] - a[1])
    .map(([idioma, total]) => ({ idioma, total }));

  const experienciaPromedio = experienciaAnios.length
    ? Math.round(experienciaAnios.reduce((a, b) => a + b, 0) / experienciaAnios.length * 10) / 10
    : 0;

  const porBarrio = Object.entries(barriosMap)
    .map(([barrio, d]) => {
      // Top 3 rubros en ese barrio
      const rubrosCount: Record<string, number> = {};
      for (const r of d.rubros) rubrosCount[r] = (rubrosCount[r] ?? 0) + 1;
      const topRubrosBarrio = Object.entries(rubrosCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
      return {
        barrio, total: d.total, rojo: d.rojo, amarillo: d.amarillo,
        pct_rojo: pct(d.rojo, d.total),
        pct_critico: pct(d.rojo, d.total),
        topRubros: topRubrosBarrio,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  const vocesOrdenadas = voces
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 20);

  return NextResponse.json({
    kpis: {
      total_usuarios:    totalUsuarios,
      con_diagnostico:   usuariosConDiag,
      whatsapp_activo:   usuariosWA,
      pct_diagnostico:   pct(usuariosConDiag, totalUsuarios),
      pct_wa:            pct(usuariosWA, totalUsuarios),
      registrados_30d:   registradosUltimos30,
      con_video_cv:      conVideoCV,
      con_capacitacion:  conCapacitacion,
      con_modulo:        conModulo,
      con_postulacion:   conPostulacion,
    },
    estadoGeneral: {
      critico: estadoCritico, alerta: estadoAlerta, estable: estadoEstable,
      pct_critico:  pct(estadoCritico, usuariosConDiag),
      pct_alerta:   pct(estadoAlerta,  usuariosConDiag),
      pct_estable:  pct(estadoEstable, usuariosConDiag),
    },
    porDimension,
    rankingCriticidad,
    estadisticasSociales: {
      situacion_laboral: situacionLaboral,
      ingreso_hogar:     ingresoHogar,
      tipo_vivienda:     tipoVivienda,
    },
    // — Inteligencia del mercado laboral
    perfilFormativo: {
      nivelesEstudios,
      topHabilidades,
      topRubros,
      topIdiomas,
      experienciaPromedio,
      conCvCargado: todosLosUsuarios.filter(u => u.cv_datos !== null).length,
    },
    alfabetizacionDigital: {
      porNivel: alfaByNivel,
      scorePromedio: alfaScoreCount > 0 ? Math.round(alfaScoreSum / alfaScoreCount) : null,
      conDato: alfaScoreCount,
    },
    actividadPlataforma: {
      conVideoCV,
      sinVideoCV,
      conCapacitacion,
      sinCapacitacion,
      conTaller,
      conModulo,
      conPostulacion,
      conReferencia,
      totalCapacitaciones,
      totalPostulaciones,
      totalModulos,
    },
    porBarrio,
    voces: vocesOrdenadas,
  });
}
