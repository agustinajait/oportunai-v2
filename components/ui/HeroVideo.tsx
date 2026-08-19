'use client';

import { useRef, useEffect } from 'react';

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Forzar play en mobile (algunos browsers bloquean autoplay)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {/* silencioso si el browser bloquea */});
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      poster="/candidato.png"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center 15%',
      }}
    >
      <source src="/hero-video.mp4" type="video/mp4" />
      <source src="/hero-video.webm" type="video/webm" />
    </video>
  );
}
