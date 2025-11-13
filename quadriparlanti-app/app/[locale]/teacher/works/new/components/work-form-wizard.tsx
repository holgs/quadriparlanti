'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Step1BasicInfo } from './step-1-basic-info';
import { Step2Content } from './step-2-content';
import { Step3Themes } from './step-3-themes';
import { Step4Review } from './step-4-review';
import { FormNavigation } from './form-navigation';
import type { Step1BasicInfoInput, Step2ContentInput, Step3ThemesInput } from '../schemas/work-form.schemas';

interface WorkFormWizardProps {
  themes: Array<{
    id: string;
    title_it: string;
    title_en: string | null;
    description_it: string;
    description_en: string | null;
    featured_image_url: string | null;
    worksCount: number;
  }>;
  teacherName: string;
  userId: string;
}

type FormData = Step1BasicInfoInput & Step2ContentInput & Step3ThemesInput;

const TOTAL_STEPS = 4;

export function WorkFormWizard({ themes, teacherName, userId }: WorkFormWizardProps) {
  const t = useTranslations('teacher.works.new');
  const router = useRouter();

  // Current step state (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Form data state
  const [formData, setFormData] = useState<Partial<FormData>>({
    title_it: '',
    title_en: '',
    description_it: '',
    description_en: '',
    class_name: '',
    teacher_name: teacherName,
    school_year: '',
    license: 'none',
    tags: [],
    attachments: [],
    external_links: [],
    theme_ids: [],
  });

  // Loading states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data
  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for updated fields
    const updatedKeys = Object.keys(data);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedKeys.forEach((key) => {
        delete newErrors[key];
      });
      return newErrors;
    });
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Step 1: Basic Info validation
      if (!formData.title_it || formData.title_it.length < 3) {
        newErrors.title_it = t('validation.titleItMin');
      }
      if (!formData.description_it || formData.description_it.length < 10) {
        newErrors.description_it = t('validation.descriptionItMin');
      }
      if (!formData.class_name) {
        newErrors.class_name = t('validation.classNameRequired');
      }
      if (!formData.teacher_name) {
        newErrors.teacher_name = t('validation.teacherNameRequired');
      }
      if (!formData.school_year) {
        newErrors.school_year = t('validation.schoolYearRequired');
      }
    } else if (step === 3) {
      // Step 3: Themes validation
      if (!formData.theme_ids || formData.theme_ids.length === 0) {
        newErrors.theme_ids = t('validation.themesRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);

    try {
      // Import createWork action
      const { createWork } = await import('@/lib/actions/works.actions');

      // Prepare attachments data
      const attachmentsData = formData.attachments?.map((att) => ({
        file_name: att.file_name,
        file_size_bytes: att.file_size_bytes,
        file_type: att.file_type,
        mime_type: att.mime_type || 'application/octet-stream',
        storage_path: att.storage_path,
        thumbnail_path: att.thumbnail_path || undefined,
      }));

      // Prepare external links data
      const externalLinksData = formData.external_links?.map((link) => ({
        url: link.url,
        platform: link.platform,
        embed_url: link.embed_url,
        link_type: link.link_type,
      }));

      const result = await createWork(
        {
          title_it: formData.title_it || 'Untitled',
          title_en: formData.title_en,
          description_it: formData.description_it || '',
          description_en: formData.description_en,
          class_name: formData.class_name || '',
          teacher_name: formData.teacher_name || teacherName,
          school_year: formData.school_year || '',
          license: formData.license,
          tags: formData.tags || [],
          theme_ids: formData.theme_ids || [],
        },
        attachmentsData,
        externalLinksData
      );

      if (result.success) {
        alert(t('messages.draftSaved'));
        router.refresh();
        router.push('/teacher');
      } else {
        alert(t('messages.error') + ': ' + (result.error || 'Failed to save draft'));
      }
    } catch (error) {
      console.error('Save draft error:', error);
      alert(t('messages.error') + ': An unexpected error occurred');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit for review
  const handleSubmit = async () => {
    // Validate all steps
    if (!validateStep(1) || !validateStep(3)) {
      alert(t('messages.error') + ': ' + t('messages.fillRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Import createWork action
      const { createWork } = await import('@/lib/actions/works.actions');

      // Prepare attachments data
      const attachmentsData = formData.attachments?.map((att) => ({
        file_name: att.file_name,
        file_size_bytes: att.file_size_bytes,
        file_type: att.file_type,
        mime_type: att.mime_type || 'application/octet-stream',
        storage_path: att.storage_path,
        thumbnail_path: att.thumbnail_path || undefined,
      }));

      // Prepare external links data
      const externalLinksData = formData.external_links?.map((link) => ({
        url: link.url,
        platform: link.platform,
        embed_url: link.embed_url,
        link_type: link.link_type,
      }));

      const result = await createWork(
        {
          title_it: formData.title_it!,
          title_en: formData.title_en,
          description_it: formData.description_it!,
          description_en: formData.description_en,
          class_name: formData.class_name!,
          teacher_name: formData.teacher_name!,
          school_year: formData.school_year!,
          license: formData.license,
          tags: formData.tags || [],
          theme_ids: formData.theme_ids!,
        },
        attachmentsData,
        externalLinksData
      );

      if (result.success) {
        // Now submit for review by updating status
        const { updateWork } = await import('@/lib/actions/works.actions');
        await updateWork(result.data.id, { status: 'pending_review' });

        alert(t('messages.submitted'));
        router.refresh();
        router.push('/teacher');
      } else {
        alert(t('messages.error') + ': ' + (result.error || 'Failed to submit work'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(t('messages.error') + ': An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={formData}
            errors={errors}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <Step2Content
            data={formData}
            userId={userId}
            errors={errors}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <Step3Themes
            data={formData}
            themes={themes}
            errors={errors}
            onChange={updateFormData}
          />
        );
      case 4:
        return (
          <Step4Review
            data={formData}
            themes={themes}
            onEdit={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  // Get step info
  const getStepInfo = (step: number) => {
    const stepKeys = ['basicInfo', 'content', 'themes', 'review'] as const;
    const key = stepKeys[step - 1];
    return {
      title: t(`steps.${key}.title`),
      description: t(`steps.${key}.description`),
    };
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step === currentStep
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>{stepInfo.title}</CardTitle>
          <CardDescription>{stepInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step content */}
          {renderStep()}

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onPrevious={goToPreviousStep}
            onNext={goToNextStep}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            isSavingDraft={isSavingDraft}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
