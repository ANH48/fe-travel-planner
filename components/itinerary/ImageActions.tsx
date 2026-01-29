'use client';

import { useState } from 'react';
import type { ItineraryImage } from '@/types/itinerary';

interface ImageActionsProps {
  image: ItineraryImage;
  onEdit: () => void;
  onDelete: () => void;
}

export function ImageActions({ image, onEdit, onDelete }: ImageActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm"
          title="Edit caption"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-red-50 text-red-600 shadow-sm"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(false);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Delete Photo?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowConfirm(false);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
