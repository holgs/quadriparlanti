'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Globe } from 'lucide-react'

interface LinkCardProps {
  url: string
  title?: string
  linkType?: string
  description?: string
  className?: string
}

export function LinkCard({ url, title, linkType, description, className }: LinkCardProps) {
  const getIcon = () => {
    if (linkType?.includes('drive')) return FileText
    return Globe
  }

  const Icon = getIcon()

  const getDomain = () => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <Card className={`${className} group transition-all hover:shadow-lg`}>
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-0.5 group-hover:text-primary transition-colors">
            {title || 'External Resource'}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {linkType && <span className="uppercase">{linkType}</span>}
            {linkType && ' • '}
            {getDomain()}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <Button size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Visit
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  )
}
