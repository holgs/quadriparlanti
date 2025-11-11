'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isSavingDraft,
  isSubmitting,
}: FormNavigationProps) {
  const t = useTranslations('teacher.works.new');

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between border-t pt-6">
      {/* Left: Previous button or spacer */}
      <div>
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isSavingDraft || isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('buttons.prev')}
          </Button>
        )}
      </div>

      {/* Right: Next/Submit + Save Draft */}
      <div className="flex gap-3">
        {/* Save Draft button (always visible) */}
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={isSavingDraft || isSubmitting}
        >
          {isSavingDraft ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('buttons.saveDraft')}
            </>
          )}
        </Button>

        {/* Next or Submit button */}
        {isLastStep ? (
          <Button
            onClick={onSubmit}
            disabled={isSavingDraft || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('buttons.submitReview')}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={isSavingDraft || isSubmitting}
          >
            {t('buttons.next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
