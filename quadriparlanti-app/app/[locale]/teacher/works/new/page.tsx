import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getThemes } from '@/lib/data/themes';
import { WorkFormWizard } from './components/work-form-wizard';

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container max-w-4xl py-8">
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
