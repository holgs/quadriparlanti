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
import { CheckCircle } from 'lucide-react';
import { approveWork } from '@/lib/actions/review.actions';
import { toast } from 'sonner';

interface ApproveDialogProps {
  work: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApproveDialog({ work, open, onOpenChange }: ApproveDialogProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      const result = await approveWork({
        work_id: work.work_id,
        comments: comments.trim() || undefined,
      });

      if (result.success) {
        toast.success('Work Approved', {
          description: result.message || 'The work has been published successfully.',
        });
        onOpenChange(false);
        setComments('');
        router.refresh();
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to approve work',
        });
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Error', {
        description: 'An unexpected error occurred',
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
            <CheckCircle className="h-5 w-5 text-success" />
            <DialogTitle>Approve Work</DialogTitle>
          </div>
          <DialogDescription>
            This work will be published and visible to all visitors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Work: {work.title_it}</p>
            <p className="text-sm text-muted-foreground">
              By: {work.teacher_name} ({work.class_name})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any feedback or notes for the teacher..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional approval message that will be saved in the review history.
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
            onClick={handleApprove}
            disabled={isSubmitting}
            className="bg-success hover:bg-success/90"
          >
            {isSubmitting ? 'Approving...' : 'Approve & Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
