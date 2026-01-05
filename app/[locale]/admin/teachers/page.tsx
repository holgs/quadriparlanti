/**
 * Teachers Management Page
 * Server Component for displaying and managing teachers
 */

import { Suspense } from 'react';
import { getTeachers, getTeacherStats } from '@/lib/actions/teachers.actions';
import { TeachersPageClient } from './components/teachers-page-client';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: 'active' | 'inactive' | 'suspended' | 'invited';
  };
}

async function TeachersContent({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const limit = 10;

  // Fetch teachers and stats in parallel
  const [teachersResult, statsResult] = await Promise.all([
    getTeachers({
      page,
      limit,
      search: searchParams.search,
      status: searchParams.status,
    }),
    getTeacherStats(),
  ]);

  if (!teachersResult.success || !statsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg">
            Errore nel caricamento dei dati
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {teachersResult.error || statsResult.error}
          </p>
        </div>
      </div>
    );
  }

  // If successful, render the client component
  return (
    <TeachersPageClient
      initialData={teachersResult.data!}
      stats={statsResult.data!}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 bg-[#272a3a]" />
          <Skeleton className="h-4 w-64 mt-2 bg-[#272a3a]" />
        </div>
        <Skeleton className="h-10 w-32 bg-[#272a3a]" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 border-[#272a3a] bg-[#1b1d27]">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-[#272a3a]" />
                <Skeleton className="h-8 w-12 bg-[#272a3a]" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg bg-[#272a3a]" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-md bg-[#272a3a]" />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-20 bg-[#272a3a]" />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="border-[#272a3a] bg-[#1b1d27]">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-[#272a3a]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 bg-[#272a3a]" />
                <Skeleton className="h-3 w-64 bg-[#272a3a]" />
              </div>
              <Skeleton className="h-6 w-20 bg-[#272a3a]" />
              <Skeleton className="h-8 w-8 bg-[#272a3a]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function TeachersPage({ searchParams }: PageProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Suspense fallback={<LoadingSkeleton />}>
        <TeachersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
