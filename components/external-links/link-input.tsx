'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, AlertCircle } from 'lucide-react';
import { validateUrl } from '@/lib/utils/url-validators';

interface LinkInputProps {
  onAdd: (url: string, platform: string, embedUrl: string) => void;
  disabled?: boolean;
}

export function LinkInput({ onAdd, disabled = false }: LinkInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');

    const validation = validateUrl(url);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    if (validation.platform && validation.embedUrl) {
      onAdd(url, validation.platform, validation.embedUrl);
      setUrl('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="link-url">Add External Link</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="link-url"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
          {error && (
            <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <Button
          onClick={handleAdd}
          disabled={disabled || !url.trim()}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Supports YouTube, Vimeo, Google Drive, and other URLs
      </p>
    </div>
  );
}
