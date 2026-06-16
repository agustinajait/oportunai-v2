export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Oportunai <notificaciones@oportunai.korai.lat>';
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurada, no se envió el email a', to);
    return { skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Error enviando email:', res.status, text);
    return { skipped: false, error: text };
  }
  return { skipped: false };
}
