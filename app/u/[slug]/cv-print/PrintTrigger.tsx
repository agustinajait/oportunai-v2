'use client';
import { useEffect } from 'react';

export default function PrintTrigger() {
  useEffect(() => {
    // Wire up the print button
    const btn = document.getElementById('print-btn');
    if (btn) btn.onclick = () => window.print();

    // Auto-print after a brief delay so styles load
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, []);
  return null;
}
