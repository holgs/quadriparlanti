'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import 'yet-another-react-lightbox/styles.css';
import { Download as DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ImageAttachment {
  id: string;
  file_name: string;
  storage_path: string;
  thumbnail_path?: string | null;
  file_size_bytes?: number;
}

interface ImageGalleryProps {
  images: ImageAttachment[];
  baseUrl: string;
}

export function ImageGallery({ images, baseUrl }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  // Prepare slides for lightbox
  const slides = images.map((img) => ({
    src: `${baseUrl}/${img.storage_path}`,
    alt: img.file_name,
    download: `${baseUrl}/${img.storage_path}?download=${encodeURIComponent(img.file_name)}`,
  }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownload = (image: ImageAttachment) => {
    const link = document.createElement('a');
    link.href = `${baseUrl}/${image.storage_path}`;
    link.download = image.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:ring-2 hover:ring-primary"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={`${baseUrl}/${image.storage_path}`}
              alt={image.file_name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Overlay with file name on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <p className="text-white text-sm font-medium truncate">
                {image.file_name}
              </p>
            </div>

            {/* Download button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image);
                }}
                className="h-8 w-8 p-0"
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom, Download]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        download={{
          download: async ({ slide }) => {
            if (typeof slide.download === 'string') {
              window.open(slide.download, '_blank');
            }
          },
        }}
      />
    </>
  );
}
