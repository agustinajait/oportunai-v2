'use client';

/**
 * GrabarCVClient — wrapper que muestra el pre-diagnóstico y luego el VideoRecorder.
 *
 * Si el usuario ya tiene al menos empleo + ingresos en korai_semaforo,
 * salta directo al grabador (no repregunta).
 */

import { useState } from 'react';
import PreDiagnostico from './PreDiagnostico';
import VideoRecorder from '@/components/ui/VideoRecorder';
import type { SessionPayload } from '@/lib/auth';

interface Modulo {
  id:            string;
  nombre_modulo: string;
  duracion_base: number;
  texto_guia:    string;
  orden:         number;
}

interface Props {
  modulos:            Modulo[];
  session:            SessionPayload;
  tienePreDiagnostico: boolean; // true si ya respondió las 3 preguntas antes
}

export default function GrabarCVClient({ modulos, session, tienePreDiagnostico }: Props) {
  const [listo, setListo] = useState(tienePreDiagnostico);

  if (!listo) {
    return <PreDiagnostico onContinuar={() => setListo(true)} />;
  }

  return <VideoRecorder modulos={modulos} session={session} tipo="video_cv" />;
}
