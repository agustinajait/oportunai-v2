'use client';
import { useState } from 'react';
import { Smartphone, CreditCard, Bot, LayoutGrid } from 'lucide-react';
import s from './landing.module.css';

const ITEMS = [
  { Icon: Smartphone, t: 'Celular y conectividad', d: '¿Cómo usás el teléfono en tu vida diaria?',  badge: 'Suma a tu perfil' },
  { Icon: CreditCard, t: 'Pagos y finanzas',        d: '¿Manejás herramientas de pago digital?',      badge: 'Suma a tu perfil' },
  { Icon: Bot,        t: 'Nuevas tecnologías',      d: '¿Conocés y usás las últimas herramientas?',   badge: 'Nativo digital' },
  { Icon: LayoutGrid, t: 'Apps cotidianas',         d: '¿Qué apps forman parte de tu rutina?',        badge: 'Suma a tu perfil' },
];

export default function AlfaExpandable({ ctaHref }: { ctaHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={s.alfaStripBtn}
      >
        {open ? 'Ocultar categorías ↑' : 'Hacer el test →'}
      </button>

      {open && (
        <div className={s.alfaGrid} style={{ marginTop: '1.5rem' }}>
          {ITEMS.map(a => (
            <a key={a.t} href={ctaHref} className={s.alfaCard} style={{ textDecoration: 'none' }}>
              <div className={s.alfaIco}>
                <a.Icon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className={s.alfaT}>{a.t}</div>
                <div className={s.alfaD}>{a.d}</div>
                <div className={s.alfaBadge}>{a.badge}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
