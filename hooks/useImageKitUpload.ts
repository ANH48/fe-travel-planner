'use client';

import { useState, useCallback } from 'react';
import { upload } from '@imagekit/javascript';
import { itineraryImagesApi } from '@/lib/api';

interface UploadProgress {
  [fileId: string]: number;
}

interface UploadedImage {
  id: string;
  imageUrl: string;
  imageKitFileId: string;
  caption?: string;
  displayOrder: number;
}

interface UseImageKitUploadOptions {
  itineraryId: string;
  onSuccess?: (image: UploadedImage) => void;
  onError?: (error: Error, fileName: string) => void;
}

export function useImageKitUpload({
  itineraryId,
  onSuccess,
  onError,
}: UseImageKitUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const fileId = `${file.name}-${Date.now()}`;
      setUploading(true);
      setError(null);
      setProgress((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        // 1. Get auth params from backend
        const { data: authParams } = await itineraryImagesApi.getAuth();

        // 2. Upload to ImageKit using the new SDK API
        const uploadResponse = await upload({
          file,
          fileName: `itinerary-${itineraryId}-${Date.now()}-${file.name}`,
          folder: '/itinerary-images/',
          signature: authParams.signature,
          token: authParams.token,
          expire: authParams.expire,
          publicKey: authParams.publicKey,
          onProgress: (event: ProgressEvent) => {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress((prev) => ({ ...prev, [fileId]: percent }));
          },
        });

        // 3. Save metadata to backend
        const { data: savedImage } = await itineraryImagesApi.create(itineraryId, {
          imageUrl: uploadResponse.url ?? '',
          imageKitFileId: uploadResponse.fileId ?? '',
        });

        // 4. Clean up progress
        setProgress((prev) => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });

        onSuccess?.(savedImage);
        return savedImage;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error.message);
        onError?.(error, file.name);

        // Clean up progress on error
        setProgress((prev) => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });

        throw error;
      } finally {
        setUploading(false);
      }
    },
    [itineraryId, onSuccess, onError]
  );

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      const results: UploadedImage[] = [];

      for (const file of files) {
        try {
          const result = await uploadFile(file);
          results.push(result);
        } catch {
          // Continue with other files
        }
      }

      return results;
    },
    [uploadFile]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    uploadFile,
    uploadMultiple,
    uploading,
    progress,
    error,
    clearError,
  };
}
