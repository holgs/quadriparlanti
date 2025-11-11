'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import type { Step1BasicInfoInput, Step3ThemesInput } from '../schemas/work-form.schemas';

type FormData = Step1BasicInfoInput & Step3ThemesInput;

interface Step4ReviewProps {
  data: Partial<FormData>;
  themes: Array<{
    id: string;
    title_it: string;
    title_en: string | null;
  }>;
  onEdit: (step: number) => void;
}

export function Step4Review({ data, themes, onEdit }: Step4ReviewProps) {
  const t = useTranslations('teacher.works.new');
  const locale = useLocale();

  const selectedThemes = themes.filter((theme) => data.theme_ids?.includes(theme.id));

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Verifica i dati inseriti prima di inviare il lavoro a revisione.
          Puoi modificare qualsiasi sezione cliccando sul pulsante "Modifica".
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informazioni Base</CardTitle>
              <CardDescription>Titolo, descrizione e dettagli</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(1)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Titolo (Italiano)
            </p>
            <p className="mt-1">{data.title_it || '-'}</p>
          </div>

          {data.title_en && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Titolo (Inglese)
              </p>
              <p className="mt-1">{data.title_en}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Descrizione (Italiano)
            </p>
            <p className="mt-1 whitespace-pre-wrap">{data.description_it || '-'}</p>
          </div>

          {data.description_en && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Descrizione (Inglese)
              </p>
              <p className="mt-1 whitespace-pre-wrap">{data.description_en}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe</p>
              <p className="mt-1">{data.class_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Docente</p>
              <p className="mt-1">{data.teacher_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anno Scolastico</p>
              <p className="mt-1">{data.school_year || '-'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Licenza</p>
            <p className="mt-1">
              {data.license === 'none' ? 'Nessuna licenza' : data.license}
            </p>
          </div>

          {data.tags && data.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tag</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Themes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Temi Associati</CardTitle>
              <CardDescription>
                {selectedThemes.length} {selectedThemes.length === 1 ? 'tema selezionato' : 'temi selezionati'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(3)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedThemes.length > 0 ? (
            <ul className="space-y-2">
              {selectedThemes.map((theme) => {
                const title = locale === 'it' ? theme.title_it : (theme.title_en || theme.title_it);
                return (
                  <li key={theme.id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{title}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nessun tema selezionato</p>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="text-warning">Attenzione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Inviando il lavoro a revisione, verrà esaminato dall'amministratore prima della
            pubblicazione.
          </p>
          <p>
            Riceverai una notifica via email quando il lavoro sarà approvato o se saranno
            necessarie modifiche.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
