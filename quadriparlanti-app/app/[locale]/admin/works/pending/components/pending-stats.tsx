import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, AlertCircle } from 'lucide-react';
import { AdminReviewQueueItem } from '@/types/database.types';

interface PendingStatsProps {
  works: AdminReviewQueueItem[];
}

export function PendingStats({ works }: PendingStatsProps) {
  const totalPending = works.length;

  // Calculate average waiting time
  const now = new Date();
  const waitingTimes = works.map((work) => {
    const submittedAt = new Date(work.submitted_at || work.created_at);
    return Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)); // days
  });

  const avgWaitingTime = waitingTimes.length > 0
    ? Math.round(waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length)
    : 0;

  // Count works waiting > 3 days
  const overdue = waitingTimes.filter((days) => days > 3).length;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPending}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Works awaiting review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgWaitingTime} days</div>
          <p className="text-xs text-muted-foreground mt-1">
            Average time in queue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{overdue}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Waiting &gt; 3 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
