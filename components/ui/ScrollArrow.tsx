'use client';

import { ChevronDown } from 'lucide-react';

interface Props {
  targetId: string;
  dark?: boolean;
}

export default function ScrollArrow({ targetId, dark = false }: Props) {
  return (
    <button
      aria-label="Ir a la siguiente sección"
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })}
      style={{
        background: dark ? 'rgba(91,63,224,0.07)' : 'rgba(255,255,255,0.12)',
        border: `1.5px solid ${dark ? 'rgba(91,63,224,0.18)' : 'rgba(255,255,255,0.22)'}`,
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: dark ? '#5B3FE0' : 'rgba(255,255,255,0.65)',
        transition: 'all 0.22s ease',
        animation: 'scrollBounce 2.2s ease-in-out infinite',
        flexShrink: 0,
        outline: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = dark
          ? 'rgba(91,63,224,0.13)' : 'rgba(255,255,255,0.2)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = dark
          ? 'rgba(91,63,224,0.35)' : 'rgba(255,255,255,0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = dark
          ? 'rgba(91,63,224,0.07)' : 'rgba(255,255,255,0.12)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = dark
          ? 'rgba(91,63,224,0.18)' : 'rgba(255,255,255,0.22)';
      }}
    >
      <ChevronDown size={20} strokeWidth={2.2} />
    </button>
  );
}
