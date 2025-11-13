'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, ExternalLink, FileText, Maximize2 } from 'lucide-react'

interface PDFViewerProps {
  fileName: string
  fileUrl: string
  fileSize?: number
  className?: string
}

export function PDFViewer({ fileName, fileUrl, fileSize, className }: PDFViewerProps) {
  const [viewerType, setViewerType] = useState<'embed' | 'google'>('embed')

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // Google Docs Viewer as fallback
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

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
            onClick={() => setViewerType(viewerType === 'embed' ? 'google' : 'embed')}
            title="Switch viewer"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </a>
          </Button>
          <Button size="sm" variant="default" asChild>
            <a href={fileUrl} download={fileName}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative bg-neutral-100 dark:bg-neutral-900 min-h-[600px]">
        {viewerType === 'embed' ? (
          <object
            data={fileUrl}
            type="application/pdf"
            className="w-full h-[600px]"
          >
            {/* Fallback content if object tag fails */}
            <div className="flex flex-col items-center justify-center h-[600px] p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">PDF Preview Not Available</p>
              <p className="text-sm text-muted-foreground mb-6">
                Your browser doesn&apos;t support embedded PDF viewing.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={fileUrl} download={fileName}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
              <Button
                variant="link"
                className="mt-4"
                onClick={() => setViewerType('google')}
              >
                Try Google Docs Viewer
              </Button>
            </div>
          </object>
        ) : (
          <iframe
            src={googleDocsUrl}
            className="w-full h-[600px]"
            title={fileName}
          />
        )}
      </div>

      {/* Footer Note */}
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="flex items-start justify-between gap-4 text-xs">
          <div className="text-muted-foreground">
            {viewerType === 'embed' ? (
              <span>Using native PDF viewer. If it doesn&apos;t work, try switching viewer or opening in a new tab.</span>
            ) : (
              <span>Using Google Docs Viewer. Switch back to native viewer if preferred.</span>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={() => setViewerType(viewerType === 'embed' ? 'google' : 'embed')}
          >
            Switch Viewer
          </Button>
        </div>
      </div>
    </Card>
  )
}
