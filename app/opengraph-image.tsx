import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Oportunai — Plataforma de Video CV';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0d9dac 0%, #0b7a86 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Logo area */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '30px solid transparent',
            borderBottom: '30px solid transparent',
            borderLeft: '52px solid white',
            marginLeft: 8,
          }}
        />
      </div>

      <div style={{ fontSize: 72, fontWeight: 700, color: 'white', letterSpacing: -2 }}>
        Oportunai
      </div>
      <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.8)', marginTop: 16 }}>
        Plataforma de Video CV y selección de talento
      </div>
    </div>,
    { ...size }
  );
}
