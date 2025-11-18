'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { WorkFileUploader, type UploadedFile } from '@/components/file-upload/work-file-uploader';
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

  // Convert existing attachments to UploadedFile format
  const existingFiles: UploadedFile[] = (data.attachments || []).map((att) => ({
    id: att.id,
    fileName: att.file_name,
    fileSize: att.file_size_bytes,
    fileType: att.file_type,
    mimeType: att.mime_type,
    storagePath: att.storage_path,
    thumbnailPath: att.thumbnail_path || undefined,
  }));

  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>(
    data.external_links || []
  );

  const handleFilesChange = (files: UploadedFile[]) => {
    // Convert UploadedFile to attachment format for form
    const attachments = files
      .filter((f) => f.storagePath) // Only include successfully uploaded files
      .map((f) => ({
        file_name: f.fileName,
        file_size_bytes: f.fileSize,
        file_type: f.fileType,
        mime_type: f.mimeType || 'application/octet-stream',
        storage_path: f.storagePath!,
        thumbnail_path: f.thumbnailPath || null,
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
    <div className="space-y-8">
      {/* File Attachments Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">File Allegati</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Carica immagini (JPG, PNG, WebP) o documenti PDF (max 10MB per file, massimo 20 file)
          </p>
        </div>

        <WorkFileUploader
          userId={userId}
          existingFiles={existingFiles}
          onFilesChange={handleFilesChange}
          maxFiles={20}
        />

        {errors.attachments && (
          <p className="text-sm text-destructive">{errors.attachments}</p>
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
          disabled={false}
        />

        {externalLinks.length > 0 && (
          <LinkList
            links={externalLinks}
            onRemove={handleRemoveLink}
            disabled={false}
          />
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">Suggerimento:</strong>{' '}
          Puoi aggiungere file e link anche successivamente modificando il lavoro.
        </p>
      </div>
    </div>
  );
}
