'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  bucket: string;
  path?: (file: File) => string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  path,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Tipo di file non supportato. Usa: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`Il file è troppo grande. Dimensione massima: ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Generate file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = path ? path(file) : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Errore durante il caricamento dell\'immagine');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Set preview and notify parent
      setPreviewUrl(publicUrl);
      onChange(data.path); // Store the storage path, not the full URL

      toast.success('Immagine caricata con successo');
    } catch (error) {
      console.error('Unexpected upload error:', error);
      toast.error('Si è verificato un errore inaspettato');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([value]);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Errore durante la rimozione dell\'immagine');
        return;
      }

      setPreviewUrl(null);
      onChange(null);
      toast.success('Immagine rimossa con successo');
    } catch (error) {
      console.error('Unexpected delete error:', error);
      toast.error('Si è verificato un errore inaspettato');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get public URL for preview if we have a storage path
  const getPreviewUrl = () => {
    if (!value) return null;

    // If value is already a full URL, use it
    if (value.startsWith('http')) return value;

    // Otherwise, get public URL from storage path
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(value);

    return publicUrl;
  };

  const displayPreviewUrl = previewUrl || getPreviewUrl();

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {displayPreviewUrl ? (
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={displayPreviewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>

          {!disabled && (
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className={cn(
            'relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed',
            'flex flex-col items-center justify-center gap-2',
            'cursor-pointer transition-colors hover:bg-muted/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Clicca per caricare un&apos;immagine</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
