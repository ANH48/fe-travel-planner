'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';

interface ImageUploadZoneProps {
  itineraryId: string;
  onImageUploaded?: (image: any) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function ImageUploadZone({
  itineraryId,
  onImageUploaded,
  disabled = false,
  maxFiles = 10,
}: ImageUploadZoneProps) {
  const { uploadMultiple, uploading, progress, error, clearError } =
    useImageKitUpload({
      itineraryId,
      onSuccess: onImageUploaded,
    });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      clearError();
      await uploadMultiple(acceptedFiles.slice(0, maxFiles));
    },
    [uploadMultiple, clearError, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || uploading,
    maxFiles,
  });

  const progressEntries = Object.entries(progress);
  const hasProgress = progressEntries.length > 0;

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop images here</p>
        ) : (
          <div className="space-y-2">
            <svg
              className="w-10 h-10 mx-auto text-gray-400"
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
            <p className="text-sm text-gray-600">
              Drag photos here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP up to 5MB (max {maxFiles} files)
            </p>
          </div>
        )}
      </div>

      {/* Progress bars */}
      {hasProgress && (
        <div className="space-y-2">
          {progressEntries.map(([fileId, percent]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="truncate max-w-[200px]">
                  {fileId.split('-')[0]}
                </span>
                <span>{percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
