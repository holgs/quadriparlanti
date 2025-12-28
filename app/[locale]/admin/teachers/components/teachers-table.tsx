'use client';

/**
 * Teachers Table Component
 * Displays teachers in a data table with actions
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MoreVertical, Edit, Trash2, Mail, KeyRound, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types/teacher.types';
import { useTranslations } from 'next-intl';
import { resendInvitation, resetTeacherPassword, generateInviteLink } from '@/lib/actions/teachers.actions';
import { toast } from 'sonner';

interface TeachersTableProps {
  teachers: User[];
  onEdit: (teacher: User) => void;
  onDelete: (teacher: User) => void;
  onUpdate: () => void;
}

export function TeachersTable({
  teachers,
  onEdit,
  onDelete,
  onUpdate,
}: TeachersTableProps) {
  const t = useTranslations('admin.teachers');
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const handleCopyInviteLink = async (teacherId: string) => {
    setLoadingActions((prev) => ({ ...prev, [`link-${teacherId}`]: true }));
    try {
      const result = await generateInviteLink(teacherId);
      if (result.success && result.link) {
        await navigator.clipboard.writeText(result.link);
        toast.success('Link di invito copiato negli appunti');
      } else {
        toast.error(result.error || 'Errore durante la generazione del link');
      }
    } catch (error) {
      toast.error('Errore durante la generazione del link');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`link-${teacherId}`]: false }));
    }
  };

  const handleResendInvitation = async (teacherId: string) => {
    setLoadingActions((prev) => ({ ...prev, [`resend-${teacherId}`]: true }));
    try {
      const result = await resendInvitation(teacherId);
      if (result.success) {
        toast.success('Invito reinviato con successo');
      } else {
        toast.error(result.error || 'Errore durante l\'invio dell\'invito');
      }
    } catch (error) {
      toast.error('Errore durante l\'invio dell\'invito');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`resend-${teacherId}`]: false }));
    }
  };

  const handleResetPassword = async (teacherId: string) => {
    setLoadingActions((prev) => ({ ...prev, [`reset-${teacherId}`]: true }));
    try {
      const result = await resetTeacherPassword(teacherId);
      if (result.success) {
        toast.success('Email di reset password inviata con successo');
      } else {
        toast.error(result.error || 'Errore durante il reset della password');
      }
    } catch (error) {
      toast.error('Errore durante il reset della password');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`reset-${teacherId}`]: false }));
    }
  };

  const getStatusBadge = (status: User['status']) => {
    const statusConfig = {
      active: {
        label: 'Attivo',
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
      },
      inactive: {
        label: 'Inattivo',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      },
      suspended: {
        label: 'Sospeso',
        className: 'bg-red-500/10 text-red-500 border-red-500/20',
      },
      invited: {
        label: 'Invitato',
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-400 text-lg">Nessun docente trovato</p>
        <p className="text-gray-500 text-sm mt-2">
          Inizia creando il tuo primo docente
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#272a3a]">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('table.name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('table.email')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('table.status')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('table.createdAt')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#272a3a]">
          {teachers.map((teacher) => (
            <tr
              key={teacher.id}
              className="hover:bg-[#1b1d27]/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-[#607afb]/10 flex items-center justify-center">
                    <span className="text-[#607afb] font-medium">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white">
                      {teacher.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-400">{teacher.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(teacher.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {format(new Date(teacher.created_at), 'dd MMM yyyy', {
                  locale: it,
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onEdit(teacher)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('actions.edit')}
                    </DropdownMenuItem>

                    {teacher.status === 'invited' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleCopyInviteLink(teacher.id)}
                          disabled={loadingActions[`link-${teacher.id}`]}
                          className="cursor-pointer"
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          {loadingActions[`link-${teacher.id}`]
                            ? 'Copia...'
                            : 'Copia Link Invito'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleResendInvitation(teacher.id)}
                          disabled={loadingActions[`resend-${teacher.id}`]}
                          className="cursor-pointer"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          {loadingActions[`resend-${teacher.id}`]
                            ? 'Invio...'
                            : t('actions.resendInvitation')}
                        </DropdownMenuItem>
                      </>
                    )}

                    {teacher.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => handleResetPassword(teacher.id)}
                        disabled={loadingActions[`reset-${teacher.id}`]}
                        className="cursor-pointer"
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        {loadingActions[`reset-${teacher.id}`]
                          ? 'Invio...'
                          : t('actions.resetPassword')}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onDelete(teacher)}
                      className="cursor-pointer text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
