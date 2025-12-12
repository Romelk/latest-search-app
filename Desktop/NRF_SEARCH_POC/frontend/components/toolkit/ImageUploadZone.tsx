'use client';

import React, { useCallback, useState } from 'react';
import { UploadedImage } from '@/lib/types/toolkit';
import { fileToDataUrl } from '@/lib/api/toolkit.client';

interface ImageUploadZoneProps {
  maxImages?: number;
  onImagesChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

export default function ImageUploadZone({
  maxImages = 1,
  onImagesChange,
  disabled = false,
}: ImageUploadZoneProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);

      // Check max images
      if (images.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} image${maxImages > 1 ? 's' : ''} allowed`);
        return;
      }

      const newImages: UploadedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);

        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          const dataUrl = await fileToDataUrl(file);
          const uploadedImage: UploadedImage = {
            id: `${Date.now()}_${i}`,
            dataUrl,
            file,
            preview: dataUrl,
          };
          newImages.push(uploadedImage);
        } catch (err) {
          console.error('Error reading file:', err);
          setError('Failed to read image file');
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const clearAll = () => {
    setImages([]);
    onImagesChange([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple={maxImages > 1}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-3">
          <div className="text-4xl">📸</div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop images or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {maxImages > 1
                ? `Upload up to ${maxImages} images (PNG, JPG, WebP, GIF, max 5MB each)`
                : 'Upload 1 image (PNG, JPG, WebP, GIF, max 5MB)'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">
              {images.length} image{images.length > 1 ? 's' : ''} uploaded
            </p>
            {images.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={image.preview}
                  alt="Upload preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {image.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Privacy:</span> Images are analyzed in real-time and not stored on our servers.
        </p>
      </div>
    </div>
  );
}
