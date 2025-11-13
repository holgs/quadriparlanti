import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/actions/auth.actions';
import { getThemeById } from '@/lib/actions/themes.actions';
import { ThemeForm } from '../../components/theme-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Modifica Tema | Admin',
  description: 'Modifica un tema esistente',
};

interface EditThemePageProps {
  params: {
    id: string;
  };
}

export default async function EditThemePage({ params }: EditThemePageProps) {
  // Check admin access
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/login');
  }

  // Fetch theme
  const result = await getThemeById(params.id);
  if (!result.success || !result.data) {
    notFound();
  }

  const theme = result.data;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/themes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Modifica Tema</h1>
          <p className="text-muted-foreground mt-2">
            Modifica le informazioni del tema: <strong>{theme.title_it}</strong>
          </p>
        </div>
        {theme.worksCount > 0 && (
          <div className="rounded-lg border bg-card px-4 py-2">
            <div className="text-sm text-muted-foreground">Lavori associati</div>
            <div className="text-2xl font-bold">{theme.worksCount}</div>
          </div>
        )}
      </div>

      {/* Form */}
      <ThemeForm
        mode="edit"
        defaultValues={{
          id: theme.id,
          title_it: theme.title_it,
          title_en: theme.title_en,
          description_it: theme.description_it,
          description_en: theme.description_en,
          slug: theme.slug,
          featured_image_url: theme.featured_image_url,
          status: theme.status as 'draft' | 'published' | 'archived',
          display_order: theme.display_order,
        }}
      />
    </div>
  );
}
