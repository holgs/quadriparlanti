'use client';

/**
 * Teachers Page Client Component
 * Manages state and interactions for the teachers management page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TeacherStatsCards } from './teacher-stats-cards';
import { SearchFilterBar } from './search-filter-bar';
import { TeachersTable } from './teachers-table';
import { Pagination } from './pagination';
import { CreateTeacherDialog } from './create-teacher-dialog';
import { EditTeacherDialog } from './edit-teacher-dialog';
import { DeleteTeacherDialog } from './delete-teacher-dialog';
import type {
  PaginatedTeachersResponse,
  TeacherStats,
  User,
} from '@/lib/types/teacher.types';
import { useTranslations } from 'next-intl';

interface TeachersPageClientProps {
  initialData: PaginatedTeachersResponse;
  stats: TeacherStats;
}

export function TeachersPageClient({
  initialData,
  stats,
}: TeachersPageClientProps) {
  const router = useRouter();
  const t = useTranslations('admin.teachers');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected teacher for edit/delete
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEdit = (teacher: User) => {
    setSelectedTeacher(teacher);
    setEditDialogOpen(true);
  };

  const handleDelete = (teacher: User) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    handleRefresh();
  };

  const handleEditSuccess = () => {
    handleRefresh();
  };

  const handleDeleteSuccess = () => {
    handleRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400 mt-1">
            Gestisci i docenti della piattaforma
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#607afb] hover:bg-[#516dfb] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('createButton')}
        </Button>
      </div>

      {/* Stats Cards */}
      <TeacherStatsCards stats={stats} />

      {/* Search and Filters */}
      <SearchFilterBar />

      {/* Teachers Table */}
      <Card className="border-[#272a3a] bg-[#1b1d27]">
        <div className="p-6">
          <TeachersTable
            teachers={initialData.teachers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdate={handleRefresh}
          />
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="px-6 pb-6">
            <Pagination
              currentPage={initialData.page}
              totalPages={initialData.totalPages}
              total={initialData.total}
            />
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <CreateTeacherDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditTeacherDialog
        teacher={selectedTeacher}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      <DeleteTeacherDialog
        teacher={selectedTeacher}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
