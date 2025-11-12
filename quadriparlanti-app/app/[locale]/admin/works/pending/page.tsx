import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { isAdmin } from '@/lib/actions/auth.actions';
import { getReviewQueue } from '@/lib/actions/review.actions';
import { PendingWorksList } from './components/pending-works-list';
import { PendingStats } from './components/pending-stats';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PendingWorksPage() {
  // Check admin access
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }

  // Fetch pending works
  const result = await getReviewQueue();

  const pendingWorks = result.success ? result.data : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Review Queue</h1>
              <p className="text-muted-foreground">
                Approve or reject student works pending review
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Statistics */}
          <PendingStats works={pendingWorks} />

          {/* Works List */}
          <PendingWorksList works={pendingWorks} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
