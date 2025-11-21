import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/actions/auth.actions';
import { ThemeForm } from '../components/theme-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Nuovo Tema | Admin',
  description: 'Crea un nuovo tema',
};

export default async function NewThemePage() {
  // Check admin access
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/themes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuovo Tema</h1>
          <p className="text-muted-foreground mt-2">
            Crea un nuovo tema tematico per organizzare i lavori degli studenti
          </p>
        </div>
      </div>

      {/* Form */}
      <ThemeForm mode="create" />
    </div>
  );
}
