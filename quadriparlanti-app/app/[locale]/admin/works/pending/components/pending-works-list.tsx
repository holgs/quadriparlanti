'use client';

import { Card } from '@/components/ui/card';
import { WorkCard } from './work-card';
import { FileText } from 'lucide-react';
import { AdminReviewQueueItem } from '@/types/database.types';

interface PendingWorksListProps {
  works: AdminReviewQueueItem[];
}

export function PendingWorksList({ works }: PendingWorksListProps) {
  if (works.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Works Pending Review</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            All works have been reviewed. Check back later when teachers submit new content.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Works ({works.length})</h2>
      <div className="grid gap-4">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
