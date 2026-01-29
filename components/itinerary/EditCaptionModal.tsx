'use client';

import { useState } from 'react';
import type { ItineraryImage } from '@/types/itinerary';

interface EditCaptionModalProps {
  image: ItineraryImage;
  onSave: (caption: string) => void;
  onClose: () => void;
}

export function EditCaptionModal({ image, onSave, onClose }: EditCaptionModalProps) {
  const [caption, setCaption] = useState(image.caption || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(caption);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Edit Caption</h3>

        <form onSubmit={handleSubmit}>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {caption.length}/500
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
