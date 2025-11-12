'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, GraduationCap, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WorkPreviewDialogProps {
  work: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkPreviewDialog({ work, open, onOpenChange }: WorkPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{work.title_it}</DialogTitle>
          <DialogDescription>
            Preview work before approving or rejecting
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Metadata */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Work Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Teacher:</span>
                  <span>{work.teacher_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Class:</span>
                  <span>{work.class_name} ({work.school_year})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{new Date(work.submitted_at || work.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Italian Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description (Italian)</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {work.description_it}
              </p>
            </div>

            {/* English Description */}
            {work.title_en && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Title (English)</h3>
                <p className="text-sm">{work.title_en}</p>
              </div>
            )}

            {work.description_en && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Description (English)</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {work.description_en}
                </p>
              </div>
            )}

            {/* Tags */}
            {work.tags && work.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {work.theme_count > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Themes</h3>
                <p className="text-sm text-muted-foreground">
                  {work.theme_count} theme{work.theme_count !== 1 ? 's' : ''} associated
                </p>
              </div>
            )}

            {/* Attachments */}
            {work.attachment_count > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Attachments</h3>
                <p className="text-sm text-muted-foreground">
                  {work.attachment_count} file{work.attachment_count !== 1 ? 's' : ''} attached
                </p>
              </div>
            )}

            {/* License */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">License</h3>
              <Badge variant="outline">{work.license || 'None'}</Badge>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
