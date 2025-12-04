'use client';

/**
 * Edit Teacher Dialog Component
 * Modal form for editing existing teachers
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateTeacher } from '@/lib/actions/teachers.actions';
import {
  updateTeacherSchema,
  type UpdateTeacherFormData,
} from '../schemas/teacher.schemas';
import type { User } from '@/lib/types/teacher.types';
import { useTranslations } from 'next-intl';

interface EditTeacherDialogProps {
  teacher: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTeacherDialog({
  teacher,
  open,
  onOpenChange,
  onSuccess,
}: EditTeacherDialogProps) {
  const t = useTranslations('admin.teachers.edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTeacherFormData>({
    resolver: zodResolver(updateTeacherSchema),
  });

  const status = watch('status');

  useEffect(() => {
    if (teacher) {
      reset({
        name: teacher.name,
        bio: teacher.bio || '',
        profile_image_url: teacher.profile_image_url || '',
        status: teacher.status === 'invited' ? 'inactive' : teacher.status,
      });
    }
  }, [teacher, reset]);

  const onSubmit = async (data: UpdateTeacherFormData) => {
    if (!teacher) return;

    setIsSubmitting(true);

    try {
      const result = await updateTeacher(teacher.id, {
        name: data.name,
        bio: data.bio || undefined,
        profile_image_url: data.profile_image_url || undefined,
        status: data.status,
      });

      if (result.success) {
        toast.success(t('successMessage'));
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Errore durante l\'aggiornamento');
      }
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            Modifica le informazioni del docente. L&apos;email non può essere
            modificata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={teacher.email}
              disabled
              className="bg-[#272a3a] opacity-60"
            />
            <p className="text-xs text-gray-400">
              L&apos;email non può essere modificata
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Mario Rossi"
              {...register('name')}
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Breve biografia del docente (opzionale)"
              rows={3}
              {...register('bio')}
              disabled={isSubmitting}
              className={errors.bio ? 'border-red-500' : ''}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_image_url">URL Immagine Profilo</Label>
            <Input
              id="profile_image_url"
              type="text"
              placeholder="https://esempio.com/immagine.jpg (opzionale)"
              {...register('profile_image_url')}
              disabled={isSubmitting}
              className={errors.profile_image_url ? 'border-red-500' : ''}
            />
            {errors.profile_image_url && (
              <p className="text-sm text-red-500">
                {errors.profile_image_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Stato</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue('status', value as 'active' | 'inactive' | 'suspended')
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="inactive">Inattivo</SelectItem>
                <SelectItem value="suspended">Sospeso</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
