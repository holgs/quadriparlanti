'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { createTheme, updateTheme } from '@/lib/actions/themes.actions';
import { generateSlug } from '@/lib/utils/slug';
import { createThemeSchema, updateThemeSchema } from '@/lib/validations/schemas';
import { toast } from 'sonner';
import { Loader2, Wand2 } from 'lucide-react';

interface ThemeFormProps {
  mode: 'create' | 'edit';
  defaultValues?: {
    id: string;
    title_it: string;
    title_en?: string | null;
    description_it: string;
    description_en?: string | null;
    slug: string;
    featured_image_url?: string | null;
    status?: 'draft' | 'published' | 'archived';
    display_order: number;
  };
}

const formSchema = z.object({
  title_it: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(100),
  title_en: z.string().min(5).max(100).optional().or(z.literal('')),
  description_it: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri').max(500),
  description_en: z.string().min(50).max(500).optional().or(z.literal('')),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug non valido (solo minuscole, numeri e trattini)'),
  featured_image_url: z.string().optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ThemeForm({ mode, defaultValues }: ThemeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title_it: defaultValues?.title_it || '',
      title_en: defaultValues?.title_en || '',
      description_it: defaultValues?.description_it || '',
      description_en: defaultValues?.description_en || '',
      slug: defaultValues?.slug || '',
      featured_image_url: defaultValues?.featured_image_url || '',
      display_order: defaultValues?.display_order || 0,
      status: defaultValues?.status || 'draft',
    },
  });

  const handleGenerateSlug = () => {
    const title = form.getValues('title_it');
    if (title) {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
    } else {
      toast.error('Inserisci prima un titolo');
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Clean up empty optional fields
      const cleanData = {
        ...data,
        title_en: data.title_en || undefined,
        description_en: data.description_en || undefined,
        featured_image_url: data.featured_image_url || undefined,
      };

      let result;
      if (mode === 'create') {
        result = await createTheme(cleanData);
      } else if (defaultValues?.id) {
        result = await updateTheme(defaultValues.id, cleanData);
      }

      if (result?.success) {
        toast.success(mode === 'create' ? 'Tema creato con successo' : 'Tema aggiornato con successo');
        router.push('/admin/themes');
        router.refresh();
      } else {
        toast.error(result?.error || 'Si è verificato un errore');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Si è verificato un errore inaspettato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Principali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Italian Title */}
            <FormField
              control={form.control}
              name="title_it"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo (Italiano) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Arte e Creatività" {...field} />
                  </FormControl>
                  <FormDescription>
                    Il titolo del tema in italiano (5-100 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Title */}
            <FormField
              control={form.control}
              name="title_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo (Inglese)</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Art and Creativity" {...field} />
                  </FormControl>
                  <FormDescription>
                    Il titolo del tema in inglese (opzionale)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL) *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="arte-e-creativita"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateSlug}
                      disabled={!form.watch('title_it')}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Genera
                    </Button>
                  </div>
                  <FormDescription>
                    URL-friendly identifier (solo minuscole, numeri e trattini)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Italian Description */}
            <FormField
              control={form.control}
              name="description_it"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione (Italiano) *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi il tema e i contenuti che raggruppa..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    La descrizione del tema in italiano (50-500 caratteri) -{' '}
                    {field.value.length}/500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Description */}
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione (Inglese)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the theme and its content..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    La descrizione del tema in inglese (opzionale) -{' '}
                    {field.value?.length || 0}/500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Display Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni di Visualizzazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Featured Image */}
            <FormField
              control={form.control}
              name="featured_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immagine di Copertina</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      bucket="theme-images"
                      path={(file) => {
                        const slug = form.getValues('slug') || 'temp';
                        const timestamp = Date.now();
                        const fileExt = file.name.split('.').pop();
                        return `${slug}/${timestamp}.${fileExt}`;
                      }}
                      maxSizeMB={5}
                      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Carica un&apos;immagine che rappresenti il tema (JPG, PNG, WebP - max 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Order */}
            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordine di Visualizzazione</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Numero più basso = appare per primo (0 = primo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (only in edit mode) */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona uno stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="published">Pubblicato</SelectItem>
                        <SelectItem value="archived">Archiviato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Solo i temi pubblicati sono visibili al pubblico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Crea Tema' : 'Salva Modifiche'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}
