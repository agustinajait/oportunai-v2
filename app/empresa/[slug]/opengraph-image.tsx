import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Ofertas de trabajo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function EmpresaOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: params.slug },
    select: { nombre: true, descripcion: true, rubro: true, ciudad: true, ofertas: { where: { estado: 'activa' }, select: { id: true } } },
  });

  const nombre = empresa?.nombre ?? 'Empresa';
  const subtitulo = empresa?.rubro ?? empresa?.ciudad ?? 'Ofertas de trabajo';
  const cantOfertas = empresa?.ofertas.length ?? 0;

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #0d4f57 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 80,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Oportunai badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 'auto',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#0d9dac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '18px solid white',
              marginLeft: 3,
            }}
          />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>Oportunai</span>
      </div>

      {/* Empresa info */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
        <div
          style={{
            fontSize: 20,
            color: '#2DE0E0',
            fontWeight: 600,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {subtitulo}
        </div>
        <div style={{ fontSize: 80, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 24 }}>
          {nombre}
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {cantOfertas > 0
            ? `${cantOfertas} ${cantOfertas === 1 ? 'posición disponible' : 'posiciones disponibles'}`
            : 'Ofertas de trabajo'}
        </div>
      </div>
    </div>,
    { ...size }
  );
}
