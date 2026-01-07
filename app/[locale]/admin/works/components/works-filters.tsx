'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface WorksFiltersProps {
    themes: any[];
}

export function WorksFilters({ themes }: WorksFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1'); // Reset page on filter change
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca per titolo o autore..."
                    className="pl-8"
                    defaultValue={searchParams.get('search')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {/* Theme Filter */}
            <Select
                defaultValue={searchParams.get('theme')?.toString() || 'all'}
                onValueChange={(val) => handleFilterChange('theme', val)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tutti i temi" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tutti i temi</SelectItem>
                    {themes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                            {theme.title_it}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
                defaultValue={searchParams.get('status')?.toString() || 'all'}
                onValueChange={(val) => handleFilterChange('status', val)}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="published">Pubblicati</SelectItem>
                    <SelectItem value="draft">Bozze</SelectItem>
                    <SelectItem value="archived">Archiviati</SelectItem>
                </SelectContent>
            </Select>

            {/* Sort */}
            <Select
                defaultValue={searchParams.get('sort')?.toString() || 'newest'}
                onValueChange={(val) => handleFilterChange('sort', val)}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ordina per" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Più recenti</SelectItem>
                    <SelectItem value="oldest">Meno recenti</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
