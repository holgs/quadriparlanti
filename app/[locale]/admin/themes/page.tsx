import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/actions/auth.actions';
import { getAllThemesAdmin } from '@/lib/actions/themes.actions';
import { ThemesTable } from './components/themes-table';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Gestione Temi | Admin',
  description: 'Gestisci i temi del portfolio',
};

export default async function AdminThemesPage() {
  // Check admin access
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/login');
  }

  // Fetch all themes
  const result = await getAllThemesAdmin();
  const themes = result.success ? result.data || [] : [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Back Button */}
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="pl-0 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Torna alla Dashboard
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Temi</h1>
          <p className="text-muted-foreground mt-2">
            Crea e gestisci i temi tematici per organizzare i lavori degli studenti
          </p>
        </div>
        <Link href="/admin/themes/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Tema
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{themes.length}</div>
            <div className="text-sm text-muted-foreground">Totale</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-green-600">
              {themes.filter((t) => t.status === 'published').length}
            </div>
            <div className="text-sm text-muted-foreground">Pubblicati</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-yellow-600">
              {themes.filter((t) => t.status === 'draft').length}
            </div>
            <div className="text-sm text-muted-foreground">Bozze</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-gray-600">
              {themes.filter((t) => t.status === 'archived').length}
            </div>
            <div className="text-sm text-muted-foreground">Archiviati</div>
          </div>
        </div>
      </div>

      {/* Themes Table */}
      <div className="rounded-lg border bg-card">
        <ThemesTable themes={themes} />
      </div>

      {/* Empty State */}
      {themes.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Nessun tema creato</h3>
            <p className="text-muted-foreground">
              Inizia creando il primo tema per organizzare i lavori degli studenti in
              collezioni tematiche.
            </p>
            <Link href="/admin/themes/new">
              <Button>Crea il primo tema</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
