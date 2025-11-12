'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, XCircle } from 'lucide-react';
import { rejectWork } from '@/lib/actions/review.actions';
import { useToast } from '@/components/ui/use-toast';

interface RejectDialogProps {
  work: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectDialog({ work, open, onOpenChange }: RejectDialogProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleReject = async () => {
    // Validate comments (required for rejection)
    if (!comments.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide feedback explaining why this work needs revision.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await rejectWork({
        work_id: work.work_id,
        comments: comments.trim(),
      });

      if (result.success) {
        toast({
          title: 'Work Rejected',
          description: result.message || 'The work has been returned for revision.',
        });
        onOpenChange(false);
        setComments('');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject work',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Reject Work</DialogTitle>
          </div>
          <DialogDescription>
            This work will be returned to the teacher for revision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Work: {work.title_it}</p>
            <p className="text-sm text-muted-foreground">
              By: {work.teacher_name} ({work.class_name})
            </p>
          </div>

          <div className="rounded-lg bg-warning/10 p-3 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-warning">
              The teacher will receive your feedback and be able to edit and resubmit the work.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-destructive">
              Feedback (Required) *
            </Label>
            <Textarea
              id="feedback"
              placeholder="Explain what needs to be revised and why..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Be specific and constructive to help the teacher improve the work.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting || !comments.trim()}
            variant="destructive"
          >
            {isSubmitting ? 'Rejecting...' : 'Reject & Return for Revision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
