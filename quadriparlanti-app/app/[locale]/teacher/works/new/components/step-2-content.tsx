'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
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
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>(
    data.external_links || []
  );

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
          Puoi saltare questo passaggio e aggiungere i link successivamente modificando il lavoro.
        </p>
      </div>
    </div>
  );
}
