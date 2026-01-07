import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getThemes } from '@/lib/data/themes';
import { WorkFormWizard } from './components/work-form-wizard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function NewWorkPage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login');
  }

  // Check if user is teacher or admin
  if (user.profile.role !== 'docente' && user.profile.role !== 'admin') {
    redirect('/');
  }

  // Fetch themes for step 3
  const themes = await getThemes();

  // Determine back link based on role
  const isDocente = user.profile.role === 'docente';
  const backLink = isDocente ? '/teacher' : '/admin/works';
  const backLabel = isDocente ? 'Torna alla Dashboard' : 'Torna a Gestione Opere';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container max-w-4xl py-8">
          {/* Back Button */}
          <Link href={backLink}>
            <Button variant="ghost" size="sm" className="pl-0 mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          </Link>

          <WorkFormWizard
            themes={themes}
            teacherName={user.profile.name || user.email}
            userId={user.id}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
