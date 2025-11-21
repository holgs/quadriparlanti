'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  accept?: {
    'application/pdf'?: string[];
    'image/*'?: string[];
  };
}

export function FileDropzone({
  onFilesAccepted,
  maxFiles = 10,
  disabled = false,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    disabled,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-2">
        {isDragActive && !isDragReject ? (
          <>
            <Upload className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-primary">Rilascia i file qui</p>
          </>
        ) : isDragReject ? (
          <>
            <Upload className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Alcuni file non sono supportati
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <Image className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Trascina i file qui o{' '}
                <span className="text-primary underline">sfoglia</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, PNG, WEBP (max 10MB per file)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
