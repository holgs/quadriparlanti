'use client';

/**
 * Delete Teacher Dialog Component
 * Confirmation dialog for deleting teachers with soft/hard delete options
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTeacher } from '@/lib/actions/teachers.actions';
import type { User } from '@/lib/types/teacher.types';
import { useTranslations } from 'next-intl';

interface DeleteTeacherDialogProps {
  teacher: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTeacherDialog({
  teacher,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTeacherDialogProps) {
  const t = useTranslations('admin.teachers.delete');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  const handleDelete = async () => {
    if (!teacher) return;

    setIsSubmitting(true);

    try {
      const result = await deleteTeacher(teacher.id, deleteType === 'hard');

      if (result.success) {
        toast.success(t('successMessage'));
        onOpenChange(false);
        onSuccess();
      } else {
        if (result.error?.includes('ha lavori')) {
          toast.error(t('hasWorksWarning'));
        } else {
          toast.error(result.error || 'Errore durante l\'eliminazione');
        }
      }
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDeleteType('soft');
      onOpenChange(false);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('message')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-[#272a3a] p-4">
            <p className="text-sm text-white font-medium">{teacher.name}</p>
            <p className="text-sm text-gray-400">{teacher.email}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo di eliminazione:</Label>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDeleteType('soft')}
                disabled={isSubmitting}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  deleteType === 'soft'
                    ? 'border-[#607afb] bg-[#607afb]/10'
                    : 'border-[#272a3a] bg-[#1b1d27] hover:border-[#3a3e55]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                      deleteType === 'soft'
                        ? 'border-[#607afb] bg-[#607afb]'
                        : 'border-gray-400'
                    }`}
                  >
                    {deleteType === 'soft' && (
                      <div className="h-full w-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t('softDelete')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Il docente verrà disattivato ma i suoi dati rimarranno nel
                      sistema. Può essere riattivato in seguito.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteType('hard')}
                disabled={isSubmitting}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  deleteType === 'hard'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-[#272a3a] bg-[#1b1d27] hover:border-[#3a3e55]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                      deleteType === 'hard'
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-400'
                    }`}
                  >
                    {deleteType === 'hard' && (
                      <div className="h-full w-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t('hardDelete')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('warningMessage')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {deleteType === 'hard' && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">
                    Attenzione: Azione Irreversibile
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    L'eliminazione permanente rimuoverà tutti i dati del docente
                    dal sistema. Questa azione non può essere annullata.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
