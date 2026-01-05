import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Analytics | Admin',
  description: 'Visualizza statistiche e analitiche della piattaforma',
};

export default async function AdminAnalyticsPage() {
  // Check admin access
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Visualizza statistiche e metriche della piattaforma
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Content Area */}
      <div className="rounded-lg border bg-card p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Funzionalità in arrivo. Torna presto per visualizzare statistiche e metriche della piattaforma.
          </p>
        </div>
      </div>
    </div>
  );
}
