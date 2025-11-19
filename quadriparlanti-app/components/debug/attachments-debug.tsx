"use client"

/**
 * Componente di debug per verificare allegati
 * Aggiungi questo temporaneamente alle pagine per vedere cosa sta succedendo
 *
 * Uso:
 * import { AttachmentsDebug } from '@/components/debug/attachments-debug'
 *
 * <AttachmentsDebug workId={work.id} attachments={work.work_attachments} />
 */

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  mime_type?: string;
}

interface AttachmentsDebugProps {
  workId: string;
  attachments: Attachment[] | null | undefined;
}

export function AttachmentsDebug({ workId, attachments }: AttachmentsDebugProps) {
  const baseStorageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-attachments`;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border-2 border-red-500 bg-yellow-100 p-4 text-sm text-black shadow-lg">
      <h3 className="mb-2 font-bold text-red-600">🐛 DEBUG ALLEGATI</h3>

      <div className="space-y-2">
        <div>
          <strong>Work ID:</strong> {workId}
        </div>

        <div>
          <strong>Attachments array:</strong>{' '}
          {attachments === null ? 'null' : attachments === undefined ? 'undefined' : `array[${attachments.length}]`}
        </div>

        {attachments && attachments.length > 0 ? (
          <div>
            <strong>Allegati trovati:</strong>
            <ul className="mt-1 space-y-1 border-l-2 border-gray-400 pl-2">
              {attachments.map((att) => (
                <li key={att.id} className="text-xs">
                  <div><strong>File:</strong> {att.file_name}</div>
                  <div><strong>Type:</strong> {att.file_type}</div>
                  <div><strong>Path:</strong> {att.storage_path}</div>
                  <div>
                    <strong>URL:</strong>{' '}
                    <a
                      href={`${baseStorageUrl}/${att.storage_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Testa
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-red-600">
            ⚠️ Nessun allegato trovato nel work.work_attachments
          </div>
        )}

        <div className="mt-2 text-xs text-gray-600">
          <div><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</div>
        </div>
      </div>
    </div>
  );
}
