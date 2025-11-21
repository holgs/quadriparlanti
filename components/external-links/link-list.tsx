'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Youtube, Play, HardDrive, Link as LinkIcon } from 'lucide-react';
import { getPlatformName, type PlatformType } from '@/lib/utils/url-validators';

export interface ExternalLink {
  id?: string;
  url: string;
  platform?: string;
  embed_url?: string;
  title?: string;
}

interface LinkListProps {
  links: ExternalLink[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'youtube':
      return Youtube;
    case 'vimeo':
      return Play;
    case 'google_drive':
      return HardDrive;
    default:
      return LinkIcon;
  }
}

export function LinkList({ links, onRemove, disabled = false }: LinkListProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">External Links ({links.length})</p>
      <div className="space-y-2">
        {links.map((link, index) => {
          const Icon = getPlatformIcon(link.platform || 'other');
          return (
            <Card key={index}>
              <CardContent className="flex items-center gap-3 p-3">
                {/* Platform icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Link info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {link.title || link.url}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {getPlatformName((link.platform || 'other') as PlatformType)}
                  </Badge>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove link</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
