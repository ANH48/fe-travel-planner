'use client';

import { useState, useEffect, useCallback } from 'react';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { ItineraryImage } from '@/types/itinerary';

interface ImageLightboxProps {
  images: ItineraryImage[];
  initialIndex: number;
  onClose: () => void;
  canEdit?: boolean;
  onUpdateCaption?: (imageId: string, caption: string) => void;
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
  canEdit,
  onUpdateCaption,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Main image */}
      <div
        className="max-w-[90vw] max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <OptimizedImage
          src={`${currentImage.imageUrl}?tr=w-1200,q-90`}
          alt={currentImage.caption || 'Itinerary photo'}
          width={1200}
          height={900}
          className="max-w-full max-h-[85vh] object-contain"
          objectFit="contain"
          priority
        />

        {/* Caption */}
        {currentImage.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-center">{currentImage.caption}</p>
          </div>
        )}
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Uploader info */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs">
        Uploaded by {currentImage.uploadedBy?.name || 'Unknown'}
      </div>
    </div>
  );
}
