'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2, Eye, MoveUp, MoveDown, ImageIcon } from 'lucide-react';
import { deleteTheme } from '@/lib/actions/themes.actions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Theme {
  id: string;
  slug: string;
  title_it: string;
  title_en: string | null;
  description_it: string;
  description_en: string | null;
  featured_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  display_order: number;
  worksCount: number;
  created_at: string;
}

interface ThemesTableProps {
  themes: Theme[];
}

export function ThemesTable({ themes }: ThemesTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!themeToDelete) return;

    setIsDeleting(true);
    const result = await deleteTheme(themeToDelete.id);

    if (result.success) {
      toast.success('Tema eliminato con successo');
      setDeleteDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Errore durante l\'eliminazione del tema');
    }
    setIsDeleting(false);
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;

    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;

    // Otherwise, get public URL from storage path
    const { data: { publicUrl } } = supabase.storage
      .from('theme-images')
      .getPublicUrl(imagePath);

    return publicUrl;
  };

  const getStatusBadge = (status: Theme['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-600">Pubblicato</Badge>;
      case 'draft':
        return <Badge variant="secondary">Bozza</Badge>;
      case 'archived':
        return <Badge variant="outline">Archiviato</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Ordine</TableHead>
            <TableHead className="w-[80px]">Immagine</TableHead>
            <TableHead>Titolo</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-center">Lavori</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nessun tema disponibile
              </TableCell>
            </TableRow>
          ) : (
            themes.map((theme) => {
              const imageUrl = getImageUrl(theme.featured_image_url);

              return (
                <TableRow key={theme.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {theme.display_order}
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-16 relative rounded overflow-hidden bg-muted flex items-center justify-center">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={theme.title_it}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{theme.title_it}</div>
                      {theme.title_en && (
                        <div className="text-sm text-muted-foreground">{theme.title_en}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {theme.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{theme.worksCount}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(theme.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/themes/${theme.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/themes/${theme.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifica
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setThemeToDelete(theme);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il tema <strong>{themeToDelete?.title_it}</strong>.
              {themeToDelete?.worksCount && themeToDelete.worksCount > 0 ? (
                <span className="block mt-2 text-destructive font-medium">
                  Attenzione: questo tema è associato a {themeToDelete.worksCount}{' '}
                  {themeToDelete.worksCount === 1 ? 'lavoro' : 'lavori'} e non può essere
                  eliminato.
                </span>
              ) : (
                <span className="block mt-2">
                  Questa azione non può essere annullata.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || (themeToDelete?.worksCount ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
