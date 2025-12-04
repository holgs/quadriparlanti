'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Step3ThemesInput } from '../schemas/work-form.schemas';

interface Step3ThemesProps {
  data: Partial<Step3ThemesInput>;
  themes: Array<{
    id: string;
    title_it: string;
    title_en: string | null;
    description_it: string;
    description_en: string | null;
    featured_image_url: string | null;
    worksCount: number;
  }>;
  errors: Record<string, string>;
  onChange: (data: Partial<Step3ThemesInput>) => void;
}

export function Step3Themes({ data, themes, errors, onChange }: Step3ThemesProps) {
  const t = useTranslations('teacher.works.new');
  const locale = useLocale();

  const selectedThemes = data.theme_ids || [];

  const toggleTheme = (themeId: string) => {
    const isSelected = selectedThemes.includes(themeId);
    const newThemes = isSelected
      ? selectedThemes.filter((id) => id !== themeId)
      : [...selectedThemes, themeId];

    onChange({ theme_ids: newThemes });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base">
          {t('fields.themes')} <span className="text-destructive">*</span>
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">{t('hints.themes')}</p>
        {errors.theme_ids && (
          <p className="mt-2 text-sm text-destructive">{errors.theme_ids}</p>
        )}
      </div>

      {themes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nessun tema disponibile. Contatta l&apos;amministratore.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {themes.map((theme) => {
            const isSelected = selectedThemes.includes(theme.id);
            const title = locale === 'it' ? theme.title_it : (theme.title_en || theme.title_it);
            const description = locale === 'it' ? theme.description_it : (theme.description_en || theme.description_it);

            return (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleTheme(theme.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`theme-${theme.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleTheme(theme.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {theme.featured_image_url && (
                  <CardContent className="pt-0">
                    <div
                      className="aspect-video w-full rounded-md bg-cover bg-center"
                      style={{ backgroundImage: `url(${theme.featured_image_url})` }}
                    />
                  </CardContent>
                )}
                <CardContent className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    {theme.worksCount} {theme.worksCount === 1 ? 'lavoro' : 'lavori'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">
            Selezionati: {selectedThemes.length}
          </strong>
          {selectedThemes.length === 0 && (
            <span className="ml-2 text-destructive">
              (Seleziona almeno un tema per continuare)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
