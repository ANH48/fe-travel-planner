'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ImageGallery,
  ImageUploadZone,
  EditCaptionModal,
} from '@/components/itinerary';
import { itineraryImagesApi } from '@/lib/api';
import type { ItineraryImage } from '@/types/itinerary';
import {
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';

export function ItineraryItemCard({ item, canModify, onDelete }: { item: any, canModify: boolean, onDelete: (id: string, name: string) => void }) {
  const [images, setImages] = useState<ItineraryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (item.id) {
      setIsLoading(true);
      itineraryImagesApi.getAll(item.id)
        .then(({ data }) => setImages(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [item.id]);

  const handleImageUploaded = (image: ItineraryImage) => {
    setImages((prev) => [...prev, image]);
  };

  const handleDeleteImage = async (imageId: string) => {
    await itineraryImagesApi.delete(imageId);
    setImages((prev) => prev.filter((i) => i.id !== imageId));
  };

  const handleUpdateCaption = async (imageId: string, caption: string) => {
    const { data: updatedImage } = await itineraryImagesApi.update(imageId, { caption });
    setImages((prev) =>
      prev.map((i) => (i.id === imageId ? { ...i, caption: updatedImage.caption } : i))
    );
  };

  const categoryStyles: any = {
    'Sightseeing': {
      bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
      badge: 'bg-purple-200 text-purple-800',
    },
    'Food & Dining': {
      bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
      badge: 'bg-orange-200 text-orange-800',
    },
    'Transportation': {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      badge: 'bg-blue-200 text-blue-800',
    },
    'Activity': {
      bg: 'bg-gradient-to-r from-green-50 to-green-100',
      badge: 'bg-green-200 text-green-800',
    },
    'Shopping': {
      bg: 'bg-gradient-to-r from-pink-50 to-pink-100',
      badge: 'bg-pink-200 text-pink-800',
    },
    'Relaxation': {
      bg: 'bg-gradient-to-r from-teal-50 to-teal-100',
      badge: 'bg-teal-200 text-teal-800',
    },
    'Meeting': {
      bg: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
      badge: 'bg-indigo-200 text-indigo-800',
    },
    'Other': {
      bg: 'bg-gradient-to-r from-gray-50 to-gray-100',
      badge: 'bg-gray-200 text-gray-800',
    },
  };
  const style = categoryStyles[item.category] || categoryStyles['Other'];

  return (
    <div className="relative group">
      <div className="absolute -left-[29px] w-4 h-4 bg-purple-500 rounded-full border-4 border-white"></div>
      <div className={`${style.bg} rounded-xl p-4 hover:shadow-md transition-all`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">
              {item.startTime} - {item.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 ${style.badge} rounded-full font-semibold`}>
              {item.category}
            </span>
            {canModify && (
              <button
                onClick={() => onDelete(item.id, item.activity)}
                className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-1">{item.activity}</h4>
        {item.location && (
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{item.location}</span>
          </div>
        )}
        {item.description && (
          <p className="text-gray-600 text-sm mb-4">{item.description}</p>
        )}
        
        <div className="mt-4">
          <h5 className="font-semibold text-gray-700 mb-2">Photos</h5>
          {isLoading ? (
            <p>Loading images...</p>
          ) : (
            <>
              {canModify && (
                <div className="mb-4">
                  <ImageUploadZone
                    itineraryId={item.id}
                    onImageUploaded={handleImageUploaded}
                  />
                </div>
              )}
              <ImageGallery
                images={images}
                canEdit={canModify}
                onDelete={handleDeleteImage}
                onUpdateCaption={handleUpdateCaption}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
