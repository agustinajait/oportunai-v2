import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Oportunai – Tu Video CV y Video Pitch',
  description: 'Creá tu Video CV o Video Pitch en minutos y compartilo con el mundo.',
  openGraph: {
    title: 'Oportunai',
    description: 'Creá tu Video CV o Video Pitch en minutos.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Oportunai',
    images: [{ url: `${process.env.NEXT_PUBLIC_APP_URL}/opengraph-image`, width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={plusJakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
