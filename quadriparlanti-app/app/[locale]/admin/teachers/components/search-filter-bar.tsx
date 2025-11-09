'use client';

/**
 * Search and Filter Bar Component
 * Provides search and status filtering for teachers list
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutti' },
  { value: 'active', label: 'Attivi' },
  { value: 'inactive', label: 'Inattivi' },
  { value: 'suspended', label: 'Sospesi' },
  { value: 'invited', label: 'Invitati' },
] as const;

export function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.teachers');

  const [searchValue, setSearchValue] = useState(
    searchParams.get('search') || ''
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );

  const debouncedSearch = useDebounce(searchValue, 300);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    updateParams({ search: debouncedSearch, status: statusFilter });
  }, [debouncedSearch, statusFilter, updateParams]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    router.push(window.location.pathname, { scroll: false });
  };

  const hasActiveFilters = searchValue || statusFilter !== 'all';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-[#1b1d27] border-[#272a3a] text-white placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-[#607afb] text-white'
                  : 'bg-[#1b1d27] text-gray-400 hover:text-white hover:bg-[#272a3a]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Pulisci filtri
          </Button>
        )}
      </div>
    </div>
  );
}
