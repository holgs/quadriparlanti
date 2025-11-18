'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, GraduationCap, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ApproveDialog } from './approve-dialog';
import { RejectDialog } from './reject-dialog';
import { AdminReviewQueueItem } from '@/types/database.types';

interface WorkCardProps {
  work: AdminReviewQueueItem;
}

export function WorkCard({ work }: WorkCardProps) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  // Calculate days waiting
  const submittedAt = new Date(work.submitted_at || work.created_at);
  const now = new Date();
  const daysWaiting = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = daysWaiting > 3;

  return (
    <>
      <Card className={isOverdue ? 'border-warning' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-2">{work.title_it}</CardTitle>
              <CardDescription className="line-clamp-2">
                {work.description_it}
              </CardDescription>
            </div>
            {isOverdue && (
              <Badge variant="outline" className="border-warning text-warning ml-4">
                Overdue
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{work.teacher_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{work.class_name} ({work.school_year})</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Submitted {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'} ago
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/preview/works/${work.id}`, '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowApprove(true)}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowReject(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ApproveDialog
        work={work}
        open={showApprove}
        onOpenChange={setShowApprove}
      />
      <RejectDialog
        work={work}
        open={showReject}
        onOpenChange={setShowReject}
      />
    </>
  );
}
