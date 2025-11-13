'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Expand, FileText, Loader2 } from 'lucide-react'

interface PDFViewerProps {
  fileName: string
  fileUrl: string
  fileSize?: number
  className?: string
}

export function PDFViewer({ fileName, fileUrl, fileSize, className }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <Card className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{fileName}</h3>
            {fileSize && (
              <p className="text-xs text-muted-foreground">
                PDF • {formatFileSize(fileSize)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Expand className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative bg-neutral-100 dark:bg-neutral-900">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}

        <iframe
          src={`${fileUrl}#view=FitH`}
          className={`w-full ${isExpanded ? 'h-[800px]' : 'h-[600px]'} transition-all`}
          title={fileName}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Footer Note */}
      <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        If the PDF doesn&apos;t display correctly, please use the download button to view it locally.
      </div>
    </Card>
  )
}
