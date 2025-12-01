import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  aspectRatio = 'auto',
  objectFit = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-portrait',
    auto: ''
  };

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    onError?.();
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center text-gray-400 text-sm ${aspectClasses[aspectRatio]} ${className}`}>
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Failed to load
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      <Image
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectFit }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};

// Avatar component for user profile pictures
interface AvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  className = '',
  fallbackColor = 'from-gray-400 to-gray-600'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
        <OptimizedImage
          src={src}
          alt={alt}
          width={80}
          height={80}
          className="w-full h-full"
          objectFit="cover"
          fallbackSrc=""
        />
      </div>
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br ${fallbackColor} flex items-center justify-center text-white font-bold ${sizeClasses[size]} ${className}`}>
      {initials || '?'}
    </div>
  );
};

// Receipt image component for expense receipts
interface ReceiptImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const ReceiptImage: React.FC<ReceiptImageProps> = ({
  src,
  alt,
  className = '',
  onClick
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsPreviewOpen(true);
    }
  };

  return (
    <>
      <div
        className={`receipt-image cursor-pointer hover:shadow-lg transition-shadow ${className}`}
        onClick={handleClick}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          width={300}
          height={400}
          className="w-full h-auto"
          objectFit="contain"
          aspectRatio="portrait"
        />
      </div>

      {isPreviewOpen && (
        <div
          className="image-preview-modal"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <OptimizedImage
              src={src}
              alt={alt}
              width={800}
              height={1000}
              className="w-full h-auto"
              objectFit="contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(false);
              }}
              className="absolute top-2 right-2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/75 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};