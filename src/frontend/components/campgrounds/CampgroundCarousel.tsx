/**
 * Campground Image Carousel Component
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image as ImageType } from '@/types';

interface CampgroundCarouselProps {
  images: ImageType[];
  title: string;
}

export function CampgroundCarousel({ images, title }: CampgroundCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-200">
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative h-96 w-full overflow-hidden rounded-lg">
        <Image
          src={images[currentIndex].url}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                index === currentIndex
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Image
                src={image.thumbnail || image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
