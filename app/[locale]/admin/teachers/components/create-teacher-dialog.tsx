'use client';

/**
 * Create Teacher Dialog Component
 * Modal form for creating new teachers
 */

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTeacher } from '@/lib/actions/teachers.actions';
import {
  createTeacherSchema,
  type CreateTeacherFormData,
} from '../schemas/teacher.schemas';
import { useTranslations } from 'next-intl';

interface CreateTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTeacherDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeacherDialogProps) {
  const t = useTranslations('admin.teachers.create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      email: '',
      name: '',
      bio: '',
      sendInvitation: true,
      password: '',
    },
  });

  const sendInvitation = watch('sendInvitation');

  const onSubmit = async (data: CreateTeacherFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createTeacher({
        email: data.email,
        name: data.name,
        bio: data.bio || undefined,
        sendInvitation: data.sendInvitation,
        password: data.password || undefined,
      });

      if (result.success) {
        toast.success(t('successMessage'));
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || t('errorMessage'));
      }
    } catch (error) {
      toast.error(t('errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            Compila i campi per creare un nuovo docente. Un&apos;email di invito può
            essere inviata automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="docente@liceo.it"
              {...register('email')}
              disabled={isSubmitting}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('nameLabel')}</Label>
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
            <Label htmlFor="bio">{t('bioLabel')}</Label>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendInvitation"
              checked={sendInvitation}
              onCheckedChange={(checked) =>
                setValue('sendInvitation', checked as boolean)
              }
              disabled={isSubmitting}
            />
            <Label
              htmlFor="sendInvitation"
              className="text-sm font-normal cursor-pointer"
            >
              {t('sendInvitationLabel')}
            </Label>
          </div>

          {!sendInvitation && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Inserisci password (minimo 8 caratteri)"
                {...register('password')}
                disabled={isSubmitting}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Quando non si invia un invito, è necessario impostare una password manualmente.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('cancelButton')}
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
