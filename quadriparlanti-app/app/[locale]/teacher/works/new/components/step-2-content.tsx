'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { FileDropzone } from '@/components/file-upload/file-dropzone';
import { FileList, type UploadedFile } from '@/components/file-upload/file-list';
import { uploadFile } from '@/lib/supabase/storage';
import { LinkInput } from '@/components/external-links/link-input';
import { LinkList, type ExternalLink } from '@/components/external-links/link-list';
import type { Step2ContentInput } from '../schemas/work-form.schemas';

interface Step2ContentProps {
  data: Partial<Step2ContentInput>;
  userId: string;
  errors: Record<string, string>;
  onChange: (data: Partial<Step2ContentInput>) => void;
}

export function Step2Content({ data, userId, errors, onChange }: Step2ContentProps) {
  const t = useTranslations('teacher.works.new');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    data.attachments?.map((att) => ({
      id: att.id,
      fileName: att.file_name,
      fileSize: att.file_size_bytes,
      fileType: att.file_type,
      storagePath: att.storage_path,
      publicUrl: att.storage_path, // Will be converted to public URL
    })) || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>(
    data.external_links || []
  );

  const handleFilesAccepted = async (files: File[]) => {
    setIsUploading(true);

    const newUploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      // Add file to list with uploading state
      const tempFile: UploadedFile = {
        file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
        uploading: true,
        progress: 0,
      };

      setUploadedFiles((prev) => [...prev, tempFile]);

      // Upload file
      const result = await uploadFile({
        file,
        userId,
        // workId will be set when creating the work
      });

      if (result.success && result.data) {
        // Update file with upload result
        const uploadedFile: UploadedFile = {
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
          fileType: result.data.fileType,
          storagePath: result.data.path,
          publicUrl: result.data.publicUrl,
          uploading: false,
          progress: 100,
        };
        newUploadedFiles.push(uploadedFile);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file ? uploadedFile : f
          )
        );
      } else {
        // Update with error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, uploading: false, error: result.error }
              : f
          )
        );
      }
    }

    // Update form data
    const attachments = uploadedFiles
      .filter((f) => f.storagePath)
      .map((f) => ({
        file_name: f.fileName,
        file_size_bytes: f.fileSize,
        file_type: f.fileType,
        storage_path: f.storagePath!,
      }));

    onChange({ attachments });
    setIsUploading(false);
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];

    // TODO: Delete from storage if uploaded
    // if (fileToRemove.storagePath) {
    //   await deleteFile(fileToRemove.storagePath);
    // }

    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    // Update form data
    const attachments = newFiles
      .filter((f) => f.storagePath)
      .map((f) => ({
        file_name: f.fileName,
        file_size_bytes: f.fileSize,
        file_type: f.fileType,
        storage_path: f.storagePath!,
      }));

    onChange({ attachments });
  };

  const handleAddLink = (url: string, platform: string, embedUrl: string) => {
    const newLink: ExternalLink = {
      url,
      platform,
      embed_url: embedUrl,
    };

    const newLinks = [...externalLinks, newLink];
    setExternalLinks(newLinks);

    // Update form data
    onChange({ external_links: newLinks });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = externalLinks.filter((_, i) => i !== index);
    setExternalLinks(newLinks);

    // Update form data
    onChange({ external_links: newLinks });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">File Allegati</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Carica PDF, immagini o altri documenti relativi al lavoro (max 10MB per file)
          </p>
        </div>

        <FileDropzone
          onFilesAccepted={handleFilesAccepted}
          disabled={isUploading}
          maxFiles={20}
        />

        {uploadedFiles.length > 0 && (
          <FileList
            files={uploadedFiles}
            onRemove={handleRemoveFile}
            disabled={isUploading}
          />
        )}

        {uploadedFiles.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file caricato' : 'file caricati'}
          </p>
        )}
      </div>

      {/* External Links Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">Link Esterni (Opzionale)</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggiungi link a video YouTube, Vimeo, Google Drive o altri contenuti online
          </p>
        </div>

        <LinkInput
          onAdd={handleAddLink}
          disabled={isUploading}
        />

        {externalLinks.length > 0 && (
          <LinkList
            links={externalLinks}
            onRemove={handleRemoveLink}
            disabled={isUploading}
          />
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">Suggerimento:</strong>{' '}
          Puoi saltare questo passaggio e aggiungere i file successivamente modificando il lavoro.
        </p>
      </div>
    </div>
  );
}
