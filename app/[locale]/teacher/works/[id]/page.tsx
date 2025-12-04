import { redirect, notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getWorkByIdForEdit } from '@/lib/data/works';
import { getThemes } from '@/lib/data/themes';
import { EditWorkForm } from './components/edit-work-form';

interface EditWorkPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditWorkPage({ params }: EditWorkPageProps) {
  // Check authentication
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    redirect('/login');
  }

  // Check if user is teacher or admin
  if (user.profile.role !== 'docente' && user.profile.role !== 'admin') {
    redirect('/');
  }

  // Fetch work data
  const work = await getWorkByIdForEdit(params.id, user.id);

  if (!work) {
    notFound();
  }

  // Check if work can be edited (only draft or needs_revision)
  const canEdit = work.status === 'draft' || work.status === 'needs_revision';

  // Fetch themes for step 3
  const themes = await getThemes();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container max-w-4xl py-8">
          <EditWorkForm
            work={work}
            themes={themes}
            teacherName={user.profile.name || user.email}
            userId={user.id}
            canEdit={canEdit}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
