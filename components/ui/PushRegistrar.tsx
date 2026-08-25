'use client';
/**
 * PushRegistrar — registra el Service Worker y la suscripción push.
 * Componente invisible que se monta en el dashboard cuando korai_opt_in = true.
 *
 * Env var pública necesaria: NEXT_PUBLIC_VAPID_PUBLIC_KEY
 */
import { useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw      = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushRegistrar() {
  useEffect(() => {
    if (
      !VAPID_PUBLIC_KEY ||
      !('serviceWorker' in navigator) ||
      !('PushManager'   in window)
    ) return;

    async function registrar() {
      try {
        // 1. Registrar el Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;

        // 2. Verificar si ya hay una suscripción activa
        const subExistente = await reg.pushManager.getSubscription();
        if (subExistente) return; // ya está suscripto, no hacer nada

        // 3. Pedir permiso de notificaciones
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') return;

        // 4. Crear nueva suscripción
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });

        // 5. Guardar en el servidor
        const subJSON = sub.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };

        await fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(subJSON),
        });
      } catch (err) {
        // No logueamos — puede fallar en modo incógnito, sobre HTTP, etc.
        console.warn('[PushRegistrar] No se pudo registrar push:', err);
      }
    }

    registrar();
  }, []);

  return null; // componente invisible
}
