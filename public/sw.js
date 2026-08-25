/**
 * Service Worker — Korai Push Notifications
 *
 * Maneja push events de web-push y los muestra como notificaciones nativas.
 * Al tocar la notificación, abre la URL específica del motivo de contacto.
 */

const CACHE_VERSION = 'korai-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push handler ──────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Korai', body: event.data.text(), url: '/dashboard', tipo: 'seguimiento' };
  }

  const { title, body, url, tipo } = payload;

  const options = {
    body,
    icon:    '/icon-192.png',
    badge:   '/badge-72.png',
    tag:     `korai-${tipo}`,          // agrupa notificaciones del mismo tipo
    renotify: true,
    vibrate: [200, 100, 200],
    data:    { url },
    actions: [
      { action: 'abrir',   title: 'Ver ahora' },
      { action: 'despues', title: 'Más tarde' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'despues') return;

  const targetUrl = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Foco en tab existente si ya está abierta
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Si no hay tab abierta, abrir una nueva
      return self.clients.openWindow(targetUrl);
    }),
  );
});
