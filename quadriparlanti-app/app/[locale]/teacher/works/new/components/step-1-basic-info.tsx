'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Step1BasicInfoInput } from '../schemas/work-form.schemas';

interface Step1BasicInfoProps {
  data: Partial<Step1BasicInfoInput>;
  errors: Record<string, string>;
  onChange: (data: Partial<Step1BasicInfoInput>) => void;
}

export function Step1BasicInfo({ data, errors, onChange }: Step1BasicInfoProps) {
  const t = useTranslations('teacher.works.new');

  // Generate school years (current year and next 2 years)
  const currentYear = new Date().getFullYear();
  const schoolYears = [];
  for (let i = -1; i <= 2; i++) {
    const startYear = currentYear + i;
    const endYear = (startYear + 1).toString().slice(-2);
    schoolYears.push(`${startYear}-${endYear}`);
  }

  return (
    <div className="space-y-6">
      {/* Title Italian */}
      <div className="space-y-2">
        <Label htmlFor="title_it">
          {t('fields.titleIt')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title_it"
          value={data.title_it || ''}
          onChange={(e) => onChange({ title_it: e.target.value })}
          placeholder={t('fields.titleItPlaceholder')}
          className={errors.title_it ? 'border-destructive' : ''}
        />
        {errors.title_it && (
          <p className="text-sm text-destructive">{errors.title_it}</p>
        )}
      </div>

      {/* Title English */}
      <div className="space-y-2">
        <Label htmlFor="title_en">{t('fields.titleEn')}</Label>
        <Input
          id="title_en"
          value={data.title_en || ''}
          onChange={(e) => onChange({ title_en: e.target.value })}
          placeholder={t('fields.titleEnPlaceholder')}
        />
        <p className="text-sm text-muted-foreground">{t('hints.titleEn')}</p>
      </div>

      {/* Description Italian */}
      <div className="space-y-2">
        <Label htmlFor="description_it">
          {t('fields.descriptionIt')} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description_it"
          value={data.description_it || ''}
          onChange={(e) => onChange({ description_it: e.target.value })}
          placeholder={t('fields.descriptionItPlaceholder')}
          rows={5}
          className={errors.description_it ? 'border-destructive' : ''}
        />
        {errors.description_it && (
          <p className="text-sm text-destructive">{errors.description_it}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {data.description_it?.length || 0} / 2000 caratteri
        </p>
      </div>

      {/* Description English */}
      <div className="space-y-2">
        <Label htmlFor="description_en">{t('fields.descriptionEn')}</Label>
        <Textarea
          id="description_en"
          value={data.description_en || ''}
          onChange={(e) => onChange({ description_en: e.target.value })}
          placeholder={t('fields.descriptionEnPlaceholder')}
          rows={5}
        />
        <p className="text-sm text-muted-foreground">{t('hints.descriptionEn')}</p>
      </div>

      {/* Class Name */}
      <div className="space-y-2">
        <Label htmlFor="class_name">
          {t('fields.className')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="class_name"
          value={data.class_name || ''}
          onChange={(e) => onChange({ class_name: e.target.value })}
          placeholder={t('fields.classNamePlaceholder')}
          className={errors.class_name ? 'border-destructive' : ''}
        />
        {errors.class_name && (
          <p className="text-sm text-destructive">{errors.class_name}</p>
        )}
      </div>

      {/* Teacher Name */}
      <div className="space-y-2">
        <Label htmlFor="teacher_name">
          {t('fields.teacherName')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="teacher_name"
          value={data.teacher_name || ''}
          onChange={(e) => onChange({ teacher_name: e.target.value })}
          placeholder={t('fields.teacherNamePlaceholder')}
          className={errors.teacher_name ? 'border-destructive' : ''}
        />
        {errors.teacher_name && (
          <p className="text-sm text-destructive">{errors.teacher_name}</p>
        )}
      </div>

      {/* School Year */}
      <div className="space-y-2">
        <Label htmlFor="school_year">
          {t('fields.schoolYear')} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.school_year || ''}
          onValueChange={(value) => onChange({ school_year: value })}
        >
          <SelectTrigger
            id="school_year"
            className={errors.school_year ? 'border-destructive' : ''}
          >
            <SelectValue placeholder={t('fields.schoolYearPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.school_year && (
          <p className="text-sm text-destructive">{errors.school_year}</p>
        )}
      </div>

      {/* License */}
      <div className="space-y-2">
        <Label htmlFor="license">{t('fields.license')}</Label>
        <Select
          value={data.license || 'none'}
          onValueChange={(value: any) => onChange({ license: value })}
        >
          <SelectTrigger id="license">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('fields.licenseNone')}</SelectItem>
            <SelectItem value="CC BY">CC BY</SelectItem>
            <SelectItem value="CC BY-SA">CC BY-SA</SelectItem>
            <SelectItem value="CC BY-NC">CC BY-NC</SelectItem>
            <SelectItem value="CC BY-NC-SA">CC BY-NC-SA</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{t('hints.license')}</p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">{t('fields.tags')}</Label>
        <Input
          id="tags"
          value={data.tags?.join(', ') || ''}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
            onChange({ tags });
          }}
          placeholder={t('fields.tagsPlaceholder')}
        />
        <p className="text-sm text-muted-foreground">{t('hints.tags')}</p>
      </div>
    </div>
  );
}
