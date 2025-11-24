'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/supabase/storage';

export interface UploadedFile {
  id?: string;
  file?: File;
  fileName: string;
  fileSize: number;
  fileType: 'image' | 'pdf';
  mimeType?: string;
  storagePath?: string;
  publicUrl?: string;
  thumbnailPath?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface WorkFileUploaderProps {
  userId: string;
  workId?: string;
  existingFiles?: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function WorkFileUploader({
  userId,
  workId,
  existingFiles = [],
  onFilesChange,
  maxFiles = 20,
  disabled = false,
}: WorkFileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      // Check max files limit
      if (files.length + acceptedFiles.length > maxFiles) {
        alert(`Puoi caricare massimo ${maxFiles} file`);
        return;
      }

      // Create temp file entries with uploading state
      const tempFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
        mimeType: file.type,
        uploading: true,
        progress: 0,
      }));

      // Add to state immediately
      const newFiles = [...files, ...tempFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const tempFileIndex = files.length + i;

        try {
          // Upload to Supabase
          const result = await uploadFile({
            file,
            userId,
            workId,
          });

          if (result.success && result.data) {
            // Update file with upload result
            const uploadData = result.data; // Type narrowing for TypeScript
            setFiles((prev) => {
              const updated = [...prev];
              updated[tempFileIndex] = {
                fileName: uploadData.fileName,
                fileSize: uploadData.fileSize,
                fileType: uploadData.fileType,
                mimeType: uploadData.mimeType,
                storagePath: uploadData.path,
                publicUrl: uploadData.publicUrl,
                thumbnailPath: uploadData.thumbnailPath,
                uploading: false,
                progress: 100,
              };
              onFilesChange(updated);
              return updated;
            });
          } else {
            // Update with error
            setFiles((prev) => {
              const updated = [...prev];
              updated[tempFileIndex] = {
                ...updated[tempFileIndex],
                uploading: false,
                error: result.error || 'Upload failed',
              };
              onFilesChange(updated);
              return updated;
            });
          }
        } catch (error) {
          console.error('Upload error:', error);
          setFiles((prev) => {
            const updated = [...prev];
            updated[tempFileIndex] = {
              ...updated[tempFileIndex],
              uploading: false,
              error: 'Upload failed',
            };
            onFilesChange(updated);
            return updated;
          });
        }
      }
    },
    [files, userId, workId, maxFiles, disabled, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Rilascia i file qui...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Trascina i file qui, oppure clicca per selezionarli
            </p>
            <p className="text-sm text-muted-foreground">
              Formati supportati: JPG, PNG, WebP, PDF • Max 10MB per file
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            File caricati ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {file.fileType === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>

                  {/* Progress or Error */}
                  {file.uploading && (
                    <div className="mt-2">
                      <Progress value={file.progress || 0} className="h-1" />
                    </div>
                  )}
                  {file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>

                {/* Status/Actions */}
                <div className="flex-shrink-0">
                  {file.uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : file.error ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
