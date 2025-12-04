'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Step1BasicInfo } from '../../new/components/step-1-basic-info';
import { Step2Content } from '../../new/components/step-2-content';
import { Step3Themes } from '../../new/components/step-3-themes';
import { Step4Review } from '../../new/components/step-4-review';
import { FormNavigation } from '../../new/components/form-navigation';
import type { Step1BasicInfoInput, Step2ContentInput, Step3ThemesInput } from '../../new/schemas/work-form.schemas';

interface EditWorkFormProps {
  work: any; // Full work object from database
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
  canEdit: boolean;
}

type FormData = Step1BasicInfoInput & Step2ContentInput & Step3ThemesInput;

const TOTAL_STEPS = 4;

export function EditWorkForm({ work, themes, teacherName, userId, canEdit }: EditWorkFormProps) {
  const t = useTranslations('teacher.works.new');
  const router = useRouter();

  // Current step state (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Initialize form data with existing work data
  const [formData, setFormData] = useState<Partial<FormData>>({
    title_it: work.title_it || '',
    title_en: work.title_en || '',
    description_it: work.description_it || '',
    description_en: work.description_en || '',
    class_name: work.class_name || '',
    teacher_name: work.teacher_name || teacherName,
    school_year: work.school_year || '',
    license: work.license || 'none',
    tags: work.tags || [],
    external_links: work.work_links || [],
    theme_ids: work.theme_ids || [],
  });

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
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

  // Save changes
  const handleSave = async () => {
    if (!canEdit) {
      alert('This work cannot be edited in its current state');
      return;
    }

    setIsSaving(true);

    try {
      // Import updateWork action
      const { updateWork } = await import('@/lib/actions/works.actions');

      // Prepare external links data
      const externalLinksData = formData.external_links?.map((link) => ({
        url: link.url,
        platform: link.platform,
        embed_url: link.embed_url,
        link_type: link.link_type,
      }));

      const result = await updateWork(
        work.id,
        {
          title_it: formData.title_it,
          title_en: formData.title_en,
          description_it: formData.description_it,
          description_en: formData.description_en,
          class_name: formData.class_name,
          teacher_name: formData.teacher_name,
          school_year: formData.school_year,
          license: formData.license,
          tags: formData.tags || [],
          theme_ids: formData.theme_ids || [],
        },
        undefined,
        externalLinksData
      );

      if (result.success) {
        alert('Changes saved successfully');
        router.refresh();
        router.push('/teacher');
      } else {
        alert('Error: ' + (result.error || 'Failed to save changes'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error: An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    // Validate all steps
    if (!validateStep(1) || !validateStep(3)) {
      alert('Error: Please fill all required fields');
      return;
    }

    if (!canEdit) {
      alert('This work cannot be submitted in its current state');
      return;
    }

    setIsSubmitting(true);

    try {
      // First save the changes
      const { updateWork } = await import('@/lib/actions/works.actions');

      // Prepare external links data
      const externalLinksData = formData.external_links?.map((link) => ({
        url: link.url,
        platform: link.platform,
        embed_url: link.embed_url,
        link_type: link.link_type,
      }));

      const updateResult = await updateWork(
        work.id,
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
        undefined,
        externalLinksData
      );

      if (!updateResult.success) {
        alert('Error: ' + (updateResult.error || 'Failed to save changes'));
        return;
      }

      // Then update status to pending_review
      const statusResult = await updateWork(work.id, {
        status: 'pending_review',
      });

      if (statusResult.success) {
        alert('Work submitted for review successfully');
        router.refresh();
        router.push('/teacher');
      } else {
        alert('Error: ' + (statusResult.error || 'Failed to submit for review'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error: An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show read-only warning if can't edit
  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{work.title_it}</h1>
            <p className="mt-2 text-muted-foreground">
              This work is {work.status} and cannot be edited
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="border-warning">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <CardTitle>Cannot Edit</CardTitle>
            </div>
            <CardDescription>
              This work is currently <strong>{work.status}</strong> and cannot be edited.
              {work.status === 'published' && ' Published works are locked.'}
              {work.status === 'pending_review' && ' Works pending review cannot be modified.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={formData as Step1BasicInfoInput}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <Step2Content
            data={formData as Step2ContentInput}
            userId={userId}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <Step3Themes
            data={formData as Step3ThemesInput}
            themes={themes}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <Step4Review
            data={formData as FormData}
            themes={themes}
            onEdit={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Work</h1>
          <p className="mt-2 text-muted-foreground">
            Update your student work submission
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/teacher">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Status indicator for needs_revision */}
      {work.status === 'needs_revision' && (
        <Card className="border-warning">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <CardTitle>Revision Requested</CardTitle>
            </div>
            <CardDescription>
              This work was returned for revision. Please review the admin feedback and make the necessary changes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-16 rounded-full transition-colors ${
                i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Basic Information'}
            {currentStep === 2 && 'Content'}
            {currentStep === 3 && 'Select Themes'}
            {currentStep === 4 && 'Review & Submit'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Update the basic details of your work'}
            {currentStep === 2 && 'Add or update external links'}
            {currentStep === 3 && 'Choose the themes this work relates to'}
            {currentStep === 4 && 'Review your changes before saving'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            onSaveDraft={handleSave}
            onSubmit={handleSubmitForReview}
            isSavingDraft={isSaving}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
