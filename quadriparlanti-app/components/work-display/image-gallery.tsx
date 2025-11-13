'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Image as ImageIcon, ZoomIn } from 'lucide-react'
import Image from 'next/image'

interface ImageAttachment {
  id: string
  file_name: string
  storage_path: string
  file_size_bytes?: number
  mime_type?: string
}

interface ImageGalleryProps {
  images: ImageAttachment[]
  baseUrl: string
  className?: string
}

export function ImageGallery({ images, baseUrl, className }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageAttachment | null>(null)

  const getImageUrl = (storagePath: string) => {
    return `${baseUrl}/${storagePath}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  if (images.length === 0) return null

  return (
    <>
      <div className={className}>
        {/* Single Image */}
        {images.length === 1 && (
          <Card className="overflow-hidden">
            <div className="relative aspect-video w-full bg-muted">
              <Image
                src={getImageUrl(images[0].storage_path)}
                alt={images[0].file_name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{images[0].file_name}</p>
                  {images[0].file_size_bytes && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(images[0].file_size_bytes)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedImage(images[0])}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={getImageUrl(images[0].storage_path)}
                    download={images[0].file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Multiple Images Grid */}
        {images.length > 1 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <Image
                    src={getImageUrl(image.storage_path)}
                    alt={image.file_name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{image.file_name}</p>
                  {image.file_size_bytes && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(image.file_size_bytes)}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={getImageUrl(selectedImage.storage_path)}
                  alt={selectedImage.file_name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedImage.file_size_bytes && (
                    <span>{formatFileSize(selectedImage.file_size_bytes)}</span>
                  )}
                </div>
                <Button variant="outline" asChild>
                  <a
                    href={getImageUrl(selectedImage.storage_path)}
                    download={selectedImage.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
