'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Eye,
    Archive,
    Trash2,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { deleteWork, updateWorkStatus } from '@/lib/actions/works.actions';
import { toast } from 'sonner';

interface WorkActionsProps {
    work: any;
}

export function WorkActions({ work }: WorkActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true);
        try {
            const result = await updateWorkStatus(work.id, newStatus);
            if (result.success) {
                toast.success(`Stato aggiornato a ${newStatus === 'published' ? 'Pubblicato' : 'Archiviato'}`);
                router.refresh();
            } else {
                toast.error(result.error || 'Errore durante l\'aggiornamento');
            }
        } catch (error) {
            toast.error('Si è verificato un errore');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Sei sicuro di voler eliminare definitivamente questa opera?')) return;

        setIsLoading(true);
        try {
            const result = await deleteWork(work.id);
            if (result.success) {
                toast.success('Opera eliminata con successo');
                router.refresh();
            } else {
                toast.error(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            toast.error('Si è verificato un errore');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href={`/works/${work.id}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizza
                    </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {work.status === 'published' ? (
                    <DropdownMenuItem onClick={() => handleStatusChange('archived')} disabled={isLoading} className="cursor-pointer text-yellow-600 focus:text-yellow-600">
                        <Archive className="mr-2 h-4 w-4" />
                        Archivia
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleStatusChange('published')} disabled={isLoading} className="cursor-pointer text-green-600 focus:text-green-600">
                        <Globe className="mr-2 h-4 w-4" />
                        Pubblica
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleDelete} disabled={isLoading} className="cursor-pointer text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Elimina
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
