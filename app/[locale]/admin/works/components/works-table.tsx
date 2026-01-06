'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WorkActions } from './work-actions';
import { Pagination } from '@/app/[locale]/admin/teachers/components/pagination';

interface WorksTableProps {
    works: any[];
    totalPages: number;
    currentPage: number;
}

export function WorksTable({ works, totalPages, currentPage }: WorksTableProps) {
    if (works.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">Nessuna opera trovata con i filtri correnti</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Pubblicato</Badge>;
            case 'draft':
                return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">Bozza</Badge>;
            case 'archived':
                return <Badge variant="secondary" className="text-muted-foreground">Archiviato</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titolo</TableHead>
                            <TableHead>Autore</TableHead>
                            <TableHead>Tema</TableHead>
                            <TableHead>Anno</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Pubblicato il</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {works.map((work) => (
                            <TableRow key={work.id}>
                                <TableCell className="font-medium">
                                    <div>{work.title_it}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {work.description_it}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{work.users?.name || 'Sconosciuto'}</div>
                                    <div className="text-xs text-muted-foreground">{work.users?.email}</div>
                                </TableCell>
                                <TableCell>
                                    {work.work_themes?.map((wt: any) => (
                                        <Badge key={wt.themes.id} variant="secondary" className="mr-1 mb-1 text-xs">
                                            {wt.themes.title_it}
                                        </Badge>
                                    ))}
                                </TableCell>
                                <TableCell>{work.school_year}</TableCell>
                                <TableCell>{getStatusBadge(work.status)}</TableCell>
                                <TableCell>
                                    {work.published_at
                                        ? format(new Date(work.published_at), 'dd MMM yyyy', { locale: it })
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <WorkActions work={work} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    total={0} // We don't have exact total in this context easily, passing 0 for now
                />
            )}
        </div>
    );
}
