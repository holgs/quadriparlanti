import { Suspense } from 'react';
import { getAdminWorks } from '@/lib/data/works';
import { getAllThemesAdmin } from '@/lib/actions/themes.actions';
import { WorksTable } from './components/works-table';
import { WorksFilters } from './components/works-filters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

interface AdminWorksPageProps {
    searchParams: {
        page?: string;
        status?: string;
        theme?: string;
        search?: string;
        sort?: 'newest' | 'oldest';
    };
}

async function WorksContent({ searchParams }: AdminWorksPageProps) {
    const page = Number(searchParams.page) || 1;

    // Fetch data in parallel
    const [worksResult, themesResult] = await Promise.all([
        getAdminWorks({
            page,
            limit: 12,
            status: searchParams.status || 'all',
            themeId: searchParams.theme || 'all',
            searchQuery: searchParams.search || '',
            sort: searchParams.sort || 'newest',
        }),
        getAllThemesAdmin(),
    ]);

    const themes = themesResult.success ? themesResult.data || [] : [];
    const { works, total, pages } = worksResult;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <WorksFilters themes={themes} />

            {/* Table */}
            <WorksTable
                works={works}
                totalPages={pages}
                currentPage={page}
            />
        </div>
    );
}

export default function AdminWorksPage({ searchParams }: AdminWorksPageProps) {
    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Back Button */}
            <Link href="/admin">
                <Button variant="ghost" size="sm" className="pl-0 gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Torna alla Dashboard
                </Button>
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestione Opere</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestisci, modera e organizza tutti i lavori caricati sulla piattaforma
                    </p>
                </div>
                <Link href="/teacher/works/new">
                    <Button size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuova Opera
                    </Button>
                </Link>
            </div>

            <Suspense fallback={<div className="text-center py-10">Caricamento opere...</div>}>
                <WorksContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}
