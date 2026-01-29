'use client';

import { useState } from 'react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ImageLightbox } from './ImageLightbox';
import { ImageActions } from './ImageActions';
import { EditCaptionModal } from './EditCaptionModal';
import type { ItineraryImage } from '@/types/itinerary';

interface ImageGalleryProps {
  images: ItineraryImage[];
  canEdit: boolean;
  onDelete?: (imageId: string) => void;
  onUpdateCaption?: (imageId: string, caption: string) => void;
}

export function ImageGallery({
  images,
  canEdit,
  onDelete,
  onUpdateCaption,
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
          >
            {/* Thumbnail */}
            <button
              onClick={() => setLightboxIndex(index)}
              className="w-full h-full"
            >
              <OptimizedImage
                src={`${image.imageUrl}?tr=w-300,h-300,fo-auto`}
                alt={image.caption || 'Itinerary photo'}
                width={300}
                height={300}
                className="w-full h-full"
                objectFit="cover"
              />
            </button>

            {/* Hover overlay with caption */}
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-white text-xs truncate">{image.caption}</p>
              </div>
            )}

            {/* Edit/Delete actions */}
            {canEdit && (
              <ImageActions
                image={image}
                onEdit={() => setEditingId(image.id)}
                onDelete={() => onDelete?.(image.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          canEdit={canEdit}
          onUpdateCaption={onUpdateCaption}
        />
      )}

      {/* Edit Caption Modal */}
      {editingId && (
        <EditCaptionModal
          image={images.find((i) => i.id === editingId)!}
          onSave={(caption) => {
            onUpdateCaption?.(editingId, caption);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
