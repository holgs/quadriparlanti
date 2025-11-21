'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Play } from 'lucide-react'

interface VideoEmbedProps {
  url: string
  title?: string
  linkType: 'youtube' | 'vimeo' | 'drive' | 'other'
  className?: string
}

export function VideoEmbed({ url, title, linkType, className }: VideoEmbedProps) {
  const getEmbedUrl = () => {
    try {
      const urlObj = new URL(url)

      // YouTube
      if (linkType === 'youtube' || urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = ''

        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1)
        } else {
          videoId = urlObj.searchParams.get('v') || ''
        }

        if (videoId) {
          return {
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
            canEmbed: true
          }
        }
      }

      // Vimeo
      if (linkType === 'vimeo' || urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').filter(Boolean)[0]
        if (videoId) {
          return {
            embedUrl: `https://player.vimeo.com/video/${videoId}`,
            canEmbed: true
          }
        }
      }

      // Google Drive (limited embed support)
      if (linkType === 'drive' || urlObj.hostname.includes('drive.google.com')) {
        const fileId = urlObj.pathname.match(/\/d\/([^/]+)/)?.[1] || urlObj.searchParams.get('id')
        if (fileId) {
          return {
            embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            canEmbed: true
          }
        }
      }

      return { embedUrl: '', canEmbed: false }
    } catch {
      return { embedUrl: '', canEmbed: false }
    }
  }

  const { embedUrl, canEmbed } = getEmbedUrl()

  // If can't embed, show a link card
  if (!canEmbed) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <ExternalLink className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1">{title || 'External Link'}</h3>
            <p className="text-sm text-muted-foreground truncate">{url}</p>
          </div>
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Visit
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    )
  }

  // Embeddable video
  return (
    <Card className={className}>
      <div className="space-y-4">
        {title && (
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground capitalize">{linkType}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Video Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-b-lg bg-black">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            title={title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </Card>
  )
}
