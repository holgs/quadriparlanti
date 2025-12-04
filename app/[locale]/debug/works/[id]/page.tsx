import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DebugSpecificWorkPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only admins can access this debug page
  if (!userData || userData.role !== 'admin') {
    redirect('/');
  }

  // Get the specific work with all its details
  const { data: work, error: workError } = await supabase
    .from('works')
    .select(`
      *,
      work_attachments (*),
      work_links (*),
      work_themes (
        themes (*)
      )
    `)
    .eq('id', params.id)
    .single();

  // Also get attachments count directly (bypass RLS by using service role query simulation)
  const { count: attachmentCount } = await supabase
    .from('work_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('work_id', params.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug: Work Details</h1>

      {workError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Work</h2>
          <pre className="text-sm">{JSON.stringify(workError, null, 2)}</pre>
        </div>
      )}

      {!work && !workError && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p>Work not found with ID: {params.id}</p>
        </div>
      )}

      {work && (
        <div className="space-y-6">
          {/* Work Info */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">{work.title_it}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID:</strong>
                <code className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  {work.id}
                </code>
              </div>
              <div>
                <strong>Status:</strong>
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900">
                  {work.status}
                </span>
              </div>
              <div>
                <strong>Created By:</strong>
                <code className="ml-2 text-xs">{work.created_by}</code>
              </div>
              <div>
                <strong>Created At:</strong> {new Date(work.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Updated At:</strong> {new Date(work.updated_at).toLocaleString()}
              </div>
              <div>
                <strong>Submitted At:</strong> {work.submitted_at ? new Date(work.submitted_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Attachments Info */}
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Attachments Information</h3>

            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {work.work_attachments?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">From SELECT query</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {attachmentCount || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Direct COUNT query</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {work.attachment_count || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">From work.attachment_count</div>
              </div>
            </div>

            {work.work_attachments && work.work_attachments.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold">Attachment Details:</h4>
                {work.work_attachments.map((att: any) => (
                  <div
                    key={att.id}
                    className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-4"
                  >
                    <div className="font-medium mb-2">{att.file_name}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong>ID:</strong>{' '}
                        <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">
                          {att.id}
                        </code>
                      </div>
                      <div>
                        <strong>Type:</strong> {att.file_type} ({att.mime_type})
                      </div>
                      <div className="col-span-2">
                        <strong>Storage Path:</strong>
                        <code className="ml-2 bg-white dark:bg-gray-900 px-1 py-0.5 rounded text-[10px]">
                          {att.storage_path}
                        </code>
                      </div>
                      <div>
                        <strong>Uploaded By:</strong> {att.uploaded_by}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(att.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-4">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  ⚠️ No attachments returned from SELECT query
                </p>
                {attachmentCount && attachmentCount > 0 && (
                  <p className="text-sm mt-2">
                    But COUNT query found {attachmentCount} attachment(s). This indicates an RLS policy issue.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Raw JSON */}
          <details className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
            <summary className="cursor-pointer font-semibold">Raw Work Data (JSON)</summary>
            <pre className="text-xs mt-4 overflow-auto">
              {JSON.stringify(work, null, 2)}
            </pre>
          </details>

          {/* Quick Links */}
          <div className="flex gap-4">
            <a
              href={`/preview/works/${work.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open Preview →
            </a>
            {work.status === 'published' && (
              <a
                href={`/works/${work.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open Public View →
              </a>
            )}
            <a
              href="/debug/attachments"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to All Works
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
