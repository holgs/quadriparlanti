import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DebugAttachmentsPage() {
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

  // Get all works with their attachments (last 20 works)
  const { data: works, error } = await supabase
    .from('works')
    .select(`
      id,
      title_it,
      status,
      created_by,
      created_at,
      work_attachments (
        id,
        file_name,
        storage_path,
        uploaded_by,
        file_type,
        mime_type,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching works:', error);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug: Work Attachments</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 dark:text-red-200 font-semibold">Error</h2>
          <pre className="text-sm mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {works && works.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p>No works found in the database.</p>
        </div>
      )}

      {works && works.length > 0 && (
        <div className="space-y-6">
          {works.map((work: any) => {
            const attachments = work.work_attachments || [];
            const hasAttachments = attachments.length > 0;

            return (
              <div
                key={work.id}
                className={`border rounded-lg p-6 ${
                  hasAttachments
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{work.title_it}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>
                        <strong>ID:</strong>{' '}
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                          {work.id}
                        </code>
                      </span>
                      <span>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            work.status === 'published'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : work.status === 'pending_review'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {work.status}
                        </span>
                      </span>
                      <span>
                        <strong>Created:</strong>{' '}
                        {new Date(work.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        hasAttachments ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                      }`}
                    >
                      {attachments.length}
                    </div>
                    <div className="text-xs text-muted-foreground">attachments</div>
                  </div>
                </div>

                {hasAttachments ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Attachments:</h3>
                    {attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm"
                      >
                        <div className="font-medium mb-2">{att.file_name}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <strong>ID:</strong>{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                              {att.id}
                            </code>
                          </div>
                          <div>
                            <strong>Type:</strong> {att.file_type} ({att.mime_type})
                          </div>
                          <div className="col-span-2">
                            <strong>Storage Path:</strong>{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                              {att.storage_path}
                            </code>
                          </div>
                          <div>
                            <strong>Uploaded:</strong> {new Date(att.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No attachments found for this work
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <a
                    href={`/preview/works/${work.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Open Preview →
                  </a>
                  {work.status === 'published' && (
                    <a
                      href={`/works/${work.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Open Public View →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div>
            <strong>Total Works:</strong> {works?.length || 0}
          </div>
          <div>
            <strong>Works with Attachments:</strong>{' '}
            {works?.filter((w: any) => w.work_attachments?.length > 0).length || 0}
          </div>
          <div>
            <strong>Total Attachments:</strong>{' '}
            {works?.reduce((sum: number, w: any) => sum + (w.work_attachments?.length || 0), 0) || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
