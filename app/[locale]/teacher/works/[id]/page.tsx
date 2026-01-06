import { redirect, notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getWorkByIdForEdit } from '@/lib/data/works';
import { getThemes } from '@/lib/data/themes';
import { EditWorkForm } from './components/edit-work-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
          {/* Back Button */}
          <Link href="/teacher">
            <Button variant="ghost" size="sm" className="pl-0 mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Torna alla Dashboard
            </Button>
          </Link>

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
