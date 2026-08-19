'use client';

import { useEffect, useRef } from 'react';

export default function ScrollReveal() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sr-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    // Observar todos los elementos con clase sr-*
    document.querySelectorAll('.sr-up, .sr-left, .sr-right, .sr-scale').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
