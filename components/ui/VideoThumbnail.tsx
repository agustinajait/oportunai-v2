'use client';

import { useRef, useState } from 'react';
import { Play, X } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  className?: string;
  /** 'sm' = small list item (40x40-ish), 'md' = card (default), 'lg' = full card */
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoThumbnail({ src, className = '', size = 'md' }: VideoThumbnailProps) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const thumbRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setHovering(true);
    thumbRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (thumbRef.current) {
      thumbRef.current.pause();
      thumbRef.current.currentTime = 0;
    }
  };

  const openModal = () => {
    setOpen(true);
    // small delay so the modal renders first
    setTimeout(() => modalRef.current?.play().catch(() => {}), 50);
  };

  const closeModal = () => {
    modalRef.current?.pause();
    setOpen(false);
  };

  const sizeClass = {
    sm: 'w-14 h-10 rounded-lg flex-shrink-0',
    md: 'w-full aspect-video rounded-xl',
    lg: 'w-full aspect-video rounded-xl',
  }[size];

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`relative cursor-pointer overflow-hidden bg-black ${sizeClass} ${className}`}
        onClick={openModal}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Ver video"
      >
        <video
          ref={thumbRef}
          src={src}
          preload="metadata"
          muted
          playsInline
          loop
          className="w-full h-full object-cover"
        />
        {/* Overlay: play icon when idle, subtle ring on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all ${hovering ? 'bg-black/20' : 'bg-black/35'}`}>
          <div className={`rounded-full bg-white/90 flex items-center justify-center shadow-md transition-transform ${hovering ? 'scale-110' : 'scale-100'} ${size === 'sm' ? 'w-6 h-6' : 'w-11 h-11'}`}>
            <Play
              size={size === 'sm' ? 10 : 18}
              className="text-gray-900 ml-0.5"
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <X size={20} /> Cerrar
            </button>
            <video
              ref={modalRef}
              src={src}
              controls
              playsInline
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
