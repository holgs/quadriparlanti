'use client';

import { Card } from '@/components/ui/card';

interface LinkPreviewProps {
  embedUrl: string;
  platform: string;
  className?: string;
}

export function LinkPreview({ embedUrl, platform, className }: LinkPreviewProps) {
  return (
    <Card className={className}>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${platform} preview`}
        />
      </div>
    </Card>
  );
}
