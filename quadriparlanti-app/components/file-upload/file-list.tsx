'use client';

import { FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatFileSize } from '@/lib/supabase/storage';

export interface UploadedFile {
  id?: string; // For existing files
  file?: File; // For new uploads
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'image';
  mimeType?: string;
  storagePath?: string;
  publicUrl?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function FileList({ files, onRemove, disabled = false }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {files.map((uploadedFile, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-3 p-3">
            {/* File icon/preview */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted">
              {uploadedFile.fileType === 'pdf' ? (
                <FileText className="h-6 w-6 text-red-500" />
              ) : uploadedFile.publicUrl ? (
                <div
                  className="h-full w-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url(${uploadedFile.publicUrl})` }}
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{uploadedFile.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(uploadedFile.fileSize)}</span>
                {uploadedFile.uploading && uploadedFile.progress !== undefined && (
                  <span>• {uploadedFile.progress}%</span>
                )}
                {uploadedFile.error && (
                  <span className="text-destructive">• {uploadedFile.error}</span>
                )}
              </div>
              {/* Progress bar */}
              {uploadedFile.uploading && uploadedFile.progress !== undefined && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadedFile.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Status/Actions */}
            {uploadedFile.uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Rimuovi file</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
