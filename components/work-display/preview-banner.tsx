'use client'

import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PreviewBannerProps {
  workId: string
  status: string
  onClose?: () => void
}

export function PreviewBanner({ workId, status, onClose }: PreviewBannerProps) {
  const router = useRouter()

  const getStatusColor = () => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
      case 'pending_review':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300'
      case 'needs_revision':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-muted/50 border-muted text-muted-foreground'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'pending_review':
        return 'Pending Review'
      case 'needs_revision':
        return 'Needs Revision'
      default:
        return 'Preview'
    }
  }

  return (
    <div className={`sticky top-0 z-50 border-b ${getStatusColor()}`}>
      <div className="container">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Preview Mode</p>
              <p className="text-xs opacity-80">
                Status: <span className="font-medium">{getStatusText()}</span> •
                This is how the work will appear to visitors once published
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.back()}
            >
              <X className="h-4 w-4 mr-1" />
              Exit Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
