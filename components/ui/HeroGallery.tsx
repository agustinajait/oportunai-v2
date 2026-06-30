'use client';
import { useState } from 'react';
import { MapPin, Briefcase, Globe } from 'lucide-react';

interface Props {
  images: string[];
  alt: string;
  color: string;
  colorLight: string;
  heroBg: string;
  ciudad?: string | null;
  rubro?: string | null;
  sitioWeb?: string | null;
  logoUrl?: string | null;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <div style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
        <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 13, margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  );
}

export default function HeroGallery({ images, alt, color, colorLight, heroBg, ciudad, rubro, sitioWeb, logoUrl }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const extras = images.slice(1, 4);

  return (
    <div style={{ width: '42%', flexShrink: 0, position: 'relative' }}>
      {/* Main image */}
      <img
        key={activeIdx}
        src={images[activeIdx] ?? images[0]}
        alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Color tint */}
      <div style={{ position: 'absolute', inset: 0, background: color, opacity: 0.22, mixBlendMode: 'multiply' }} />
      {/* Gradient fade */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${heroBg} 0%, ${heroBg}4D 40%, transparent 70%)` }} />

      {/* Info card */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 14, padding: '16px 18px',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 190, zIndex: 10,
      }}>
        {ciudad && <InfoRow icon={<MapPin size={14} />} label="UBICACIÓN" value={ciudad} />}
        {rubro && <InfoRow icon={<Briefcase size={14} />} label="RUBRO" value={rubro} />}
        {sitioWeb && <InfoRow icon={<Globe size={14} />} label="WEB" value={sitioWeb.replace(/https?:\/\/(www\.)?/, '')} />}
      </div>

      {/* Logo top-right */}
      {logoUrl && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <img src={logoUrl} alt={alt} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
        </div>
      )}

      {/* Thumbnails — hover to preview */}
      {extras.length > 0 && (
        <div style={{ position: 'absolute', bottom: 24, left: 16, display: 'flex', gap: 6, zIndex: 10 }}>
          {extras.map((url, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveIdx(i + 1)}
              onMouseLeave={() => setActiveIdx(0)}
              style={{
                width: 56, height: 56, padding: 0, cursor: 'pointer', flexShrink: 0,
                borderRadius: 8, overflow: 'hidden',
                border: activeIdx === i + 1 ? `2px solid ${colorLight}` : '2px solid rgba(255,255,255,0.4)',
                transform: activeIdx === i + 1 ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
